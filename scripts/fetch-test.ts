// Fetch each candidate page and report: HTTP status, text length, paragraphs.
import { candidates } from './sources-list.ts';
import { fetchHtml, extractMain } from './fetch.ts';

for (const c of candidates) {
  try {
    const { status, html } = await fetchHtml(c.url);
    const { title, paragraphs } = extractMain(html);
    const chars = paragraphs.join(' ').length;
    console.log(`${status} ${String(chars).padStart(6)} ch ${String(paragraphs.length).padStart(3)} par  ${c.id}  | ${title.slice(0, 60)}`);
  } catch (e) {
    console.log(`ERR ${c.id}: ${(e as Error).message}`);
  }
}
