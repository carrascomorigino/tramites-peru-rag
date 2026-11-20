// Show best-hit score and coverage for each case (used to pick the threshold from the TUNE set only).
import { readFileSync } from 'node:fs';
import { loadCorpus } from '../scripts/corpus.ts';
import { buildIndex, search } from '../src/lib/search.ts';

const file = process.argv[2] ?? 'evals/tune.json';
const cases = JSON.parse(readFileSync(file, 'utf8'));
const { sources, chunks } = loadCorpus();
const ms = buildIndex(chunks, sources);
for (const c of cases) {
  const r = search(ms, c.q, { minCoverage: 0, minScore: 0 });
  const top = r.hits.slice(0, 3).map((h) => h.chunk.sourceId);
  const b = r.hits[0];
  const hit = c.expect === 'no-se' ? 'NOSE' : top.some((t: string) => c.expect.includes(t)) ? 'HIT ' : 'MISS';
  console.log(`${hit} score=${b ? b.score.toFixed(1).padStart(5) : '  -  '} cov=${b ? b.coverage.toFixed(2) : '-'} terms=${r.queryTerms.join(',')} | ${c.q} -> ${top.join(', ')}`);
}
