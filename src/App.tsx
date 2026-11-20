import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type MiniSearch from 'minisearch';
import samplesJson from '../samples/answers.json';
import sourcesJson from '../corpus/sources.json';
import thresholdJson from '../evals/threshold.json';
import { loadIndex, search, type Hit, type IndexedChunk, type SearchResult } from './lib/search.ts';
import { askClaude, MODEL, type ClaudeAnswer } from './lib/anthropic.ts';
import type { SampleAnswer, SourceEntry } from './lib/types.ts';

const samples = samplesJson as SampleAnswer[];
const sources = sourcesJson as SourceEntry[];
const sourceById = new Map(sources.map((s) => [s.id, s]));
const threshold = { minCoverage: thresholdJson.minCoverage, minScore: thresholdJson.minScore };
const HELP_URL = 'https://orientacion.sunat.gob.pe/';
const KEY_STORE = 'anthropic-key';

/** Link that jumps to the quote, where the browser supports text fragments. */
function quoteLink(url: string, quote: string): string {
  const start = quote.split(/\s+/).slice(0, 8).join(' ').replace(/[.,;:]+$/, '');
  return `${url}#:~:text=${encodeURIComponent(start).replace(/-/g, '%2D')}`;
}

function SourceCard({ n, sourceId, quote }: { n: number; sourceId: string; quote: string }) {
  const src = sourceById.get(sourceId);
  if (!src) return null;
  return (
    <li className="source">
      <span className="num">[{n}]</span>
      <div>
        <blockquote>“{quote}”</blockquote>
        <p className="meta">
          Fuente: <a href={quoteLink(src.url, quote)} target="_blank" rel="noopener noreferrer">{src.title}</a>
          <span> — revisado el {src.checked}</span>
        </p>
      </div>
    </li>
  );
}

function NoSe() {
  return (
    <div className="card nose" role="status">
      <h2>No sé.</h2>
      <p>
        No encontré esto en las fuentes oficiales de esta demo. Revisa la orientación de SUNAT:{' '}
        <a href={HELP_URL} target="_blank" rel="noopener noreferrer">orientacion.sunat.gob.pe</a>
      </p>
    </div>
  );
}

function SampleView({ s }: { s: SampleAnswer }) {
  return (
    <div className="card">
      <p className="label">Respuesta preparada y verificada contra la fuente</p>
      <h2>{s.q}</h2>
      {s.parts.map((p, i) => (
        <p key={i}>
          {p.text} <span className="cites">{p.cite.map((c) => `[${c + 1}]`).join('')}</span>
        </p>
      ))}
      <ol className="sources">
        {s.citations.map((c, i) => <SourceCard key={i} n={i + 1} sourceId={c.sourceId} quote={c.quote} />)}
      </ol>
    </div>
  );
}

function HitsView({ q, hits }: { q: string; hits: Hit[] }) {
  return (
    <div className="card">
      <p className="label">Búsqueda sin IA: fragmentos de fuentes oficiales</p>
      <h2>{q}</h2>
      <ol className="sources">
        {hits.slice(0, 3).map((h, i) => (
          <SourceCard key={h.chunk.id} n={i + 1} sourceId={h.chunk.sourceId} quote={h.chunk.text} />
        ))}
      </ol>
      <p className="hint">¿Quieres una respuesta redactada con Claude? Agrega tu propia clave abajo.</p>
    </div>
  );
}

function ClaudeView({ q, hits, ans }: { q: string; hits: Hit[]; ans: ClaudeAnswer }) {
  const used = [...new Set(ans.parts.flatMap((p) => p.citations.map((c) => c.documentIndex)))];
  return (
    <div className="card">
      <p className="label">Respuesta de Claude con citas ({MODEL})</p>
      <h2>{q}</h2>
      <p>
        {ans.parts.map((p, i) => (
          <span key={i}>
            {p.text}
            {p.citations.length > 0 && (
              <span className="cites">{[...new Set(p.citations.map((c) => `[${used.indexOf(c.documentIndex) + 1}]`))].join('')}</span>
            )}
          </span>
        ))}
      </p>
      {used.length > 0 && (
        <ol className="sources">
          {used.map((d, i) => {
            const quote = ans.parts.flatMap((p) => p.citations).find((c) => c.documentIndex === d)?.citedText ?? '';
            return <SourceCard key={d} n={i + 1} sourceId={hits[d].chunk.sourceId} quote={quote.trim()} />;
          })}
        </ol>
      )}
      <p className="meta">Tokens: {ans.inputTokens} de entrada, {ans.outputTokens} de salida. Se cobran a tu clave.</p>
    </div>
  );
}

type View =
  | { kind: 'none' }
  | { kind: 'sample'; s: SampleAnswer }
  | { kind: 'search'; q: string; r: SearchResult }
  | { kind: 'claude'; q: string; hits: Hit[]; ans: ClaudeAnswer }
  | { kind: 'loading'; q: string }
  | { kind: 'error'; msg: string };

function readStoredKey(): string {
  try {
    return sessionStorage.getItem(KEY_STORE) ?? '';
  } catch {
    return '';
  }
}

export function App() {
  const [index, setIndex] = useState<MiniSearch<IndexedChunk> | null>(null);
  const [q, setQ] = useState('');
  const [view, setView] = useState<View>({ kind: 'none' });
  const [key, setKey] = useState(readStoredKey);
  const [remember, setRemember] = useState(() => readStoredKey() !== '');

  useEffect(() => {
    fetch('./index.json')
      .then((r) => r.text())
      .then((t) => setIndex(loadIndex(t)))
      .catch(() => setView({ kind: 'error', msg: 'No se pudo cargar el índice de búsqueda.' }));
  }, []);

  useEffect(() => {
    try {
      if (remember && key) sessionStorage.setItem(KEY_STORE, key);
      else sessionStorage.removeItem(KEY_STORE);
    } catch {
      /* storage blocked: the key stays in memory only */
    }
  }, [remember, key]);

  const sampleChips = useMemo(() => samples.map((s) => ({ id: s.id, q: s.q })), []);

  async function onAsk(e: FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question || !index) return;
    const r = search(index, question, threshold);
    // The "No sé" gate runs before any AI call, in both modes.
    if (r.answer === 'no-se' || !key) {
      setView({ kind: 'search', q: question, r });
      return;
    }
    setView({ kind: 'loading', q: question });
    try {
      const hits = r.hits.slice(0, 4);
      const ans = await askClaude(key, question, hits);
      setView({ kind: 'claude', q: question, hits, ans });
    } catch (err) {
      setView({ kind: 'error', msg: `Error de la API de Anthropic: ${(err as Error).message}` });
    }
  }

  return (
    <main>
      <header>
        <h1>Trámites SUNAT para independientes</h1>
        <p className="sub">Pregunta en español. Siempre con la fuente oficial. Si no sabe, dice “No sé”.</p>
        <p className="banner" role="note">
          Demo. No es un servicio oficial de SUNAT. No es asesoría tributaria. Las reglas cambian: verifica siempre en la fuente oficial.
          No escribas tu DNI ni tu RUC.
        </p>
      </header>

      <form onSubmit={onAsk} className="ask">
        <label htmlFor="q" className="sr">Tu pregunta</label>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: ¿Cómo emito un recibo por honorarios?" autoComplete="off" />
        <button type="submit" disabled={!index || !q.trim()}>Preguntar</button>
      </form>

      <section aria-label="Preguntas de ejemplo" className="chips">
        {sampleChips.map((c) => (
          <button key={c.id} type="button" className="chip" onClick={() => setView({ kind: 'sample', s: samples.find((s) => s.id === c.id)! })}>
            {c.q}
          </button>
        ))}
      </section>

      <section aria-live="polite">
        {view.kind === 'sample' && <SampleView s={view.s} />}
        {view.kind === 'search' && (view.r.answer === 'no-se' ? <NoSe /> : <HitsView q={view.q} hits={view.r.hits} />)}
        {view.kind === 'claude' && <ClaudeView q={view.q} hits={view.hits} ans={view.ans} />}
        {view.kind === 'loading' && <div className="card"><p>Preguntando a Claude…</p></div>}
        {view.kind === 'error' && <div className="card nose"><p>{view.msg}</p></div>}
      </section>

      <details className="key">
        <summary>{key ? 'Tu clave de Anthropic está activa' : 'Opcional: usa tu propia clave de Anthropic'}</summary>
        <p>
          Con tu clave, Claude redacta la respuesta y cita las fuentes. Sin clave, la búsqueda sigue funcionando gratis.
          Tu clave, tu costo. No la compartas. La clave queda en tu navegador y solo se envía a api.anthropic.com.
        </p>
        <p className="hint">No necesitas clave para probar la demo. Si quieres usar una, hazlo seguro:</p>
        <ul className="hint">
          <li>Crea una clave nueva en un workspace aparte de Anthropic, con un límite de gasto bajo (ej.: USD 1). Bórrala después de probar.</li>
          <li>
            Revisa el código que envía la clave:{' '}
            <a href="https://github.com/carrascomorigino/tramites-peru-rag/blob/main/src/lib/anthropic.ts" target="_blank" rel="noopener noreferrer">src/lib/anthropic.ts</a>.
          </li>
          <li>Abre la pestaña Red (Network) de tu navegador: verás llamadas solo a api.anthropic.com.</li>
        </ul>
        <label htmlFor="key" className="sr">Clave de API de Anthropic</label>
        <input id="key" type="password" value={key} onChange={(e) => setKey(e.target.value.trim())} placeholder="Clave de API" autoComplete="off" spellCheck={false} />
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Recordar en esta pestaña
        </label>
        {key && <button type="button" onClick={() => setKey('')}>Borrar clave</button>}
      </details>

      <footer>
        <p>Fuentes: {sources.length} páginas de gob.pe y SUNAT. Código abierto (MIT). Hecho por <a href="https://mapagino.com" target="_blank" rel="noopener noreferrer">Mapagino</a>.</p>
      </footer>
    </main>
  );
}
