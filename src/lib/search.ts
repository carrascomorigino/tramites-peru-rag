import MiniSearch from 'minisearch';
import type { Chunk, SourceEntry } from './types.ts';
import { processTerm, tokenize } from './text.ts';

export interface IndexedChunk extends Chunk {
  title: string;
}

export interface Threshold {
  /** Min share of query terms found in the best hit (0..1). */
  minCoverage: number;
  /** Min BM25 score of the best hit. */
  minScore: number;
}

export interface Hit {
  chunk: IndexedChunk;
  score: number;
  coverage: number;
}

export interface SearchResult {
  answer: 'hits' | 'no-se';
  hits: Hit[];
  queryTerms: string[];
}

export const MINISEARCH_OPTIONS = {
  fields: ['title', 'heading', 'text'],
  storeFields: ['sourceId', 'heading', 'text', 'title'],
  processTerm,
  searchOptions: {
    boost: { title: 2, heading: 1.5 },
    fuzzy: (term: string) => (term.length > 5 ? 0.2 : false),
    combineWith: 'OR' as const,
  },
};

export function buildIndex(chunks: Chunk[], sources: SourceEntry[]): MiniSearch<IndexedChunk> {
  const titles = new Map(sources.map((s) => [s.id, s.title]));
  const ms = new MiniSearch<IndexedChunk>(MINISEARCH_OPTIONS);
  ms.addAll(chunks.map((c) => ({ ...c, title: titles.get(c.sourceId) ?? '' })));
  return ms;
}

export function loadIndex(json: string): MiniSearch<IndexedChunk> {
  return MiniSearch.loadJSON<IndexedChunk>(json, MINISEARCH_OPTIONS);
}

/**
 * Query synonyms on whole words (normalized): everyday words -> words the official pages use.
 * Word level, not stem level, so "SAC" (a company type) is not read as "saco".
 * Built from the TUNE set only. Keep it small.
 */
export const SYNONYMS: Record<string, string[]> = {
  saco: ['obtener', 'inscribir'],
  sacar: ['obtener', 'inscribir'],
  saca: ['obtener', 'inscribir'],
  pido: ['solicitar'],
  pedir: ['solicitar'],
  olvide: ['recuperar'],
  olvido: ['recuperar'],
  tramitar: ['solicitar'],
};

/** One group per query word: the stem of the word plus the stems of its synonyms. */
export function queryGroups(q: string): string[][] {
  const groups: string[][] = [];
  const seen = new Set<string>();
  for (const w of tokenize(q)) {
    const t = processTerm(w);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    const syn = (SYNONYMS[w] ?? []).map(processTerm).filter((x): x is string => !!x);
    groups.push([t, ...syn]);
  }
  return groups;
}

/** Search, then apply the "No sé" gate. The gate is code, not AI. */
export function search(ms: MiniSearch<IndexedChunk>, q: string, th: Threshold, k = 5): SearchResult {
  const groups = queryGroups(q);
  const terms = groups.map((g) => g[0]);
  if (!terms.length) return { answer: 'no-se', hits: [], queryTerms: terms };
  const expanded = groups.flat();
  // Terms are already processed, so skip processTerm for the query.
  const raw = ms.search(expanded.join(' '), { processTerm: (t) => t }).slice(0, k);
  const hits: Hit[] = raw.map((r) => {
    const matched = new Set(r.queryTerms);
    return {
      chunk: { id: r.id, sourceId: r.sourceId, heading: r.heading, text: r.text, title: r.title },
      score: r.score,
      coverage: groups.filter((g) => g.some((t) => matched.has(t))).length / groups.length,
    };
  });
  const best = hits[0];
  const ok = !!best && best.coverage >= th.minCoverage && best.score >= th.minScore;
  return { answer: ok ? 'hits' : 'no-se', hits, queryTerms: terms };
}
