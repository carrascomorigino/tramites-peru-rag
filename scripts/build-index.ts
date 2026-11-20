// Build the search index from corpus/ and write public/index.json + public/sources.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadCorpus } from './corpus.ts';
import { buildIndex } from '../src/lib/search.ts';

const { sources, chunks } = loadCorpus();
const ms = buildIndex(chunks, sources);
mkdirSync('public', { recursive: true });
writeFileSync('public/index.json', JSON.stringify(ms));
writeFileSync('public/sources.json', JSON.stringify(sources));
console.log(`Index: ${chunks.length} chunks from ${sources.length} sources.`);
