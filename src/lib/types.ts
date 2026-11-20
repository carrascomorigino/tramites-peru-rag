export type Topic = 'ruc' | 'clave-sol' | 'rhe' | 'suspension' | 'anual';

export interface SourceEntry {
  id: string;
  topic: Topic;
  url: string;
  title: string;
  /** Date the page was last checked (YYYY-MM-DD). */
  checked: string;
  /** auto = a script can fetch it; manual = Gino checks it by hand. */
  check: 'auto' | 'manual';
}

export interface Snapshot extends Omit<SourceEntry, 'check'> {
  paragraphs: string[];
}

export interface Chunk {
  /** "<sourceId>#<n>" */
  id: string;
  sourceId: string;
  heading: string;
  text: string;
}
