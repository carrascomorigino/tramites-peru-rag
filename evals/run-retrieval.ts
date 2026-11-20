// Retrieval eval on a case file (default: the held-out test set). Free: no API.
// Prints source hit rate (top 3) and "No sé" precision / recall. Exit 1 if under the floor.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadCorpus } from '../scripts/corpus.ts';
import { buildIndex, search, type Threshold } from '../src/lib/search.ts';

export interface Case { q: string; expect: string[] | 'no-se' }

export function runEval(cases: Case[], th: Threshold) {
  const { sources, chunks } = loadCorpus();
  const ms = buildIndex(chunks, sources);
  let inScope = 0, hit = 0, tp = 0, fp = 0;
  const rows = cases.map((c) => {
    const r = search(ms, c.q, th);
    const top3 = r.hits.slice(0, 3).map((h) => h.chunk.sourceId);
    let pass: boolean;
    if (c.expect === 'no-se') {
      pass = r.answer === 'no-se';
      if (pass) tp++;
    } else {
      inScope++;
      if (r.answer === 'no-se') fp++;
      const exp = c.expect;
      pass = r.answer === 'hits' && top3.some((t) => exp.includes(t));
      if (pass) hit++;
    }
    return { pass, q: c.q, answer: r.answer, top3 };
  });
  const outOfScope = cases.length - inScope;
  return {
    rows,
    inScope, hit, outOfScope,
    noSePrecision: tp + fp ? tp / (tp + fp) : 1,
    noSeRecall: outOfScope ? tp / outOfScope : 1,
  };
}

const isMain = (process.argv[1] ?? '').split(String.fromCharCode(92)).join('/').endsWith('evals/run-retrieval.ts');
if (isMain) {
  const file = process.argv[2] ?? 'evals/test.json';
  const th: Threshold = JSON.parse(readFileSync('evals/threshold.json', 'utf8'));
  const res = runEval(JSON.parse(readFileSync(file, 'utf8')), th);
  for (const r of res.rows) console.log(`${r.pass ? 'PASS' : 'FAIL'} [${r.answer}] ${r.q} -> ${r.top3.join(', ')}`);
  const summary = `${file}: ${res.rows.length} cases. Source hit (top 3): ${res.hit}/${res.inScope}. "No sé" precision ${res.noSePrecision.toFixed(2)}, recall ${res.noSeRecall.toFixed(2)} (${res.outOfScope} out-of-scope cases). Threshold: cov>=${th.minCoverage}, score>=${th.minScore}.`;
  console.log('\n' + summary);
  if (process.argv.includes('--save')) {
    mkdirSync('evals/results', { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    writeFileSync(`evals/results/${day}-retrieval.md`, `# Retrieval eval, ${day}\n\n${summary}\n\n` + res.rows.map((r) => `- ${r.pass ? 'PASS' : 'FAIL'} [${r.answer}] ${r.q} → ${r.top3.join(', ')}`).join('\n') + '\n');
  }
}
