import { readFileSync, readdirSync } from 'node:fs';
import { chunkSnapshot } from '../src/lib/chunk.ts';
import type { Snapshot, SourceEntry } from '../src/lib/types.ts';

export function loadCorpus(dir = 'corpus') {
  const sources: SourceEntry[] = JSON.parse(readFileSync(`${dir}/sources.json`, 'utf8'));
  const snaps: Snapshot[] = readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'sources.json')
    .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
  const chunks = snaps.flatMap(chunkSnapshot);
  return { sources, snaps, chunks };
}
