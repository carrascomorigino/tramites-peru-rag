import * as cheerio from 'cheerio';

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

export async function fetchHtml(url: string, retries = 3): Promise<{ status: number; html: string }> {
  let last: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es-PE,es;q=0.9' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      return { status: res.status, html: await res.text() };
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw last;
}

const MAIN_SELECTORS = ['article', 'main', '#main-content', '.region-content', '#content', 'body'];
const JUNK = /^(Añadir nuevo comentario|Compartir|Imprimir)$/i;
const BLOCK = 'h1,h2,h3,h4,h5,p,li,td,th,dt,dd,blockquote';

/** Extract main text as paragraphs. Headings start with "## ". */
export function extractMain(html: string): { title: string; paragraphs: string[] } {
  const $ = cheerio.load(html);
  $('script,style,noscript,nav,header,footer,form,iframe,svg,button,[aria-hidden="true"],.breadcrumb,.menu').remove();
  const title = ($('h1').first().text() || $('title').text()).replace(/\s+/g, ' ').trim();
  let root: ReturnType<typeof $> = $('body');
  for (const sel of MAIN_SELECTORS) {
    const el = $(sel).first();
    if (el.length && el.text().replace(/\s+/g, ' ').trim().length > 300) { root = el; break; }
  }
  const out: string[] = [];
  root.find(BLOCK).each((_, el) => {
    // skip blocks that contain other blocks (avoid duplicates)
    if ($(el).find(BLOCK).length) return;
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t.length < 3 || JUNK.test(t)) return;
    const tag = (el as { tagName?: string }).tagName ?? '';
    out.push(/^h\d$/.test(tag) ? `## ${t}` : t);
  });
  return { title, paragraphs: out.filter((p, i) => out.indexOf(p) === i) };
}
