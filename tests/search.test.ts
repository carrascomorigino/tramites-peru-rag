import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chunkSnapshot } from '../src/lib/chunk.ts';
import { buildIndex, queryGroups, search } from '../src/lib/search.ts';
import { loadCorpus } from '../scripts/corpus.ts';
import { runEval, type Case } from '../evals/run-retrieval.ts';

const th = JSON.parse(readFileSync('evals/threshold.json', 'utf8'));
const floor = JSON.parse(readFileSync('evals/floor.json', 'utf8'));
const read = (f: string): Case[] => JSON.parse(readFileSync(f, 'utf8'));

describe('chunkSnapshot', () => {
  it('splits at headings and keeps the heading', () => {
    const chunks = chunkSnapshot({
      id: 's', topic: 'ruc', url: 'https://www.gob.pe/x', title: 'T', checked: '2026-11-19',
      paragraphs: ['intro', '## Requisitos', 'DNI', 'Clave SOL'],
    });
    expect(chunks.map((c) => [c.heading, c.text])).toEqual([['T', 'intro'], ['Requisitos', 'DNI\nClave SOL']]);
  });
});

describe('queryGroups', () => {
  it('maps everyday words to official words, at word level only', () => {
    expect(queryGroups('saco mi RUC')[0].length).toBeGreaterThan(1);
    expect(queryGroups('empresa SAC').every((g) => g.length === 1)).toBe(true);
  });
});

describe('No sé gate', () => {
  const { sources, chunks } = loadCorpus();
  const ms = buildIndex(chunks, sources);
  it('answers with a source for an in-scope question', () => {
    const r = search(ms, '¿Cómo emito un recibo por honorarios electrónico?', th);
    expect(r.answer).toBe('hits');
    expect(r.hits[0].chunk.sourceId).toBe('gobpe-emitir-rhe');
  });
  it('says No sé for an empty or off-topic question', () => {
    expect(search(ms, '¿?', th).answer).toBe('no-se');
    expect(search(ms, 'Receta de ceviche', th).answer).toBe('no-se');
  });
});

describe('retrieval evals', () => {
  it('tune set: all cases pass', () => {
    const res = runEval(read('evals/tune.json'), th);
    expect(res.rows.filter((r) => !r.pass).map((r) => r.q)).toEqual([]);
  });
  it('held-out test set: at or above the regression floor', () => {
    const res = runEval(read('evals/test.json'), th);
    expect(res.hit / res.inScope).toBeGreaterThanOrEqual(floor.minHitRate);
    expect(res.noSeRecall).toBeGreaterThanOrEqual(floor.minNoSeRecall);
  });
});

describe('corpus', () => {
  const { sources, snaps } = loadCorpus();
  it('every snapshot is listed in sources.json, from an official domain', () => {
    const ids = new Set(sources.map((s) => s.id));
    for (const s of snaps) expect(ids.has(s.id)).toBe(true);
    for (const s of sources) expect(new URL(s.url).hostname).toMatch(/(^|\.)(gob\.pe)$/);
  });
});
