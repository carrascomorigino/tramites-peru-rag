// Live check (weekly, never in pull-request CI). For each `auto` source: open the live page,
// extract the main text, normalize it, and report which snapshot paragraphs (and, from week 3,
// which sample-answer quotes) are no longer on the page. Exit 1 only if a page fails to load
// or a quote is missing. Paragraph drift is a warning: refresh the snapshot by hand.
import { existsSync, readFileSync } from 'node:fs';
import { fetchHtml, extractMain } from './fetch.ts';
import { loadCorpus } from './corpus.ts';
import { normalize } from '../src/lib/text.ts';

const { sources, snaps } = loadCorpus();
const quotes: { sourceId: string; quote: string }[] = existsSync('samples/answers.json')
  ? JSON.parse(readFileSync('samples/answers.json', 'utf8')).flatMap((a: { citations: { sourceId: string; quote: string }[] }) => a.citations)
  : [];
let failed = 0;

for (const src of sources.filter((s) => s.check === 'auto')) {
  const snap = snaps.find((s) => s.id === src.id)!;
  try {
    const { status, html } = await fetchHtml(src.url);
    if (status !== 200) { console.log(`FAIL ${src.id}: HTTP ${status}`); failed++; continue; }
    const live = normalize(extractMain(html).paragraphs.join(' '));
    const gone = snap.paragraphs.filter((p) => !live.includes(normalize(p.replace(/^## /, ''))));
    const lostQuotes = quotes.filter((q) => q.sourceId === src.id && !live.includes(normalize(q.quote)));
    if (lostQuotes.length) { failed++; for (const q of lostQuotes) console.log(`FAIL ${src.id}: quote gone: "${q.quote.slice(0, 80)}"`); }
    console.log(`${gone.length ? 'WARN' : 'OK  '} ${src.id}: ${snap.paragraphs.length - gone.length}/${snap.paragraphs.length} snapshot paragraphs still live`);
    for (const p of gone.slice(0, 3)) console.log(`       changed: "${p.slice(0, 90)}"`);
  } catch (e) {
    console.log(`FAIL ${src.id}: ${(e as Error).message}`); failed++;
  }
}
process.exit(failed ? 1 : 0);
