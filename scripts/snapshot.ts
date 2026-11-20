// Save a snapshot of each source page in corpus/<id>.json and update corpus/sources.json.
// Usage: npm run snapshot            (all sources)
//        npm run snapshot -- <id>    (one source)
import { writeFileSync, mkdirSync } from 'node:fs';
import { candidates } from './sources-list.ts';
import { fetchHtml, extractMain } from './fetch.ts';
import type { Snapshot, SourceEntry } from '../src/lib/types.ts';

const only = process.argv[2];
const today = new Date().toISOString().slice(0, 10);
mkdirSync('corpus', { recursive: true });
const sources: SourceEntry[] = [];

for (const c of candidates) {
  if (only && c.id !== only) continue;
  const { status, html } = await fetchHtml(c.url);
  if (status !== 200) {
    console.log(`SKIP ${c.id}: HTTP ${status}`);
    continue;
  }
  const { title, paragraphs } = extractMain(html);
  const snap: Snapshot = { id: c.id, topic: c.topic, url: c.url, title, checked: today, paragraphs };
  writeFileSync(`corpus/${c.id}.json`, JSON.stringify(snap, null, 2) + '\n');
  sources.push({ id: c.id, topic: c.topic, url: c.url, title, checked: today, check: 'auto' });
  console.log(`OK ${c.id} (${paragraphs.length} paragraphs)`);
}
if (!only) writeFileSync('corpus/sources.json', JSON.stringify(sources, null, 2) + '\n');
