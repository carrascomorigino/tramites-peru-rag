import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCorpus } from '../scripts/corpus.ts';
import { normalize } from '../src/lib/text.ts';
import type { SampleAnswer } from '../src/lib/types.ts';

const samples: SampleAnswer[] = JSON.parse(readFileSync('samples/answers.json', 'utf8'));
const { sources, snaps } = loadCorpus();
const text = new Map(snaps.map((s) => [s.id, normalize(s.paragraphs.map((p) => p.replace(/^## /, '')).join(' '))]));

describe('sample answers', () => {
  it('have unique ids', () => {
    expect(new Set(samples.map((s) => s.id)).size).toBe(samples.length);
  });
  for (const s of samples) {
    describe(s.id, () => {
      it('every quote is word-for-word in its snapshot (after normalize), min 20 chars', () => {
        for (const c of s.citations) {
          expect(sources.some((src) => src.id === c.sourceId), c.sourceId).toBe(true);
          expect(c.quote.length, c.quote).toBeGreaterThanOrEqual(20);
          expect(text.get(c.sourceId)!.includes(normalize(c.quote)), c.quote).toBe(true);
        }
      });
      it('every part cites at least one quote, and every quote is used', () => {
        const used = new Set<number>();
        for (const p of s.parts) {
          expect(p.cite.length, p.text).toBeGreaterThan(0);
          for (const i of p.cite) {
            expect(i).toBeLessThan(s.citations.length);
            used.add(i);
          }
        }
        expect(used.size).toBe(s.citations.length);
      });
    });
  }
});
