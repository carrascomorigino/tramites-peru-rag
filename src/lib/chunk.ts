import type { Chunk, Snapshot } from './types.ts';

const MAX_CHARS = 700;

/** Split a snapshot into chunks: one heading section, cut at about MAX_CHARS. */
export function chunkSnapshot(s: Snapshot): Chunk[] {
  const chunks: Chunk[] = [];
  let heading = s.title;
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) chunks.push({ id: `${s.id}#${chunks.length}`, sourceId: s.id, heading, text: buf.join('\n') });
    buf = [];
  };
  for (const p of s.paragraphs) {
    if (p.startsWith('## ')) {
      flush();
      heading = p.slice(3);
      continue;
    }
    if (buf.length && buf.join('\n').length + p.length > MAX_CHARS) flush();
    buf.push(p);
  }
  flush();
  return chunks;
}
