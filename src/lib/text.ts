import snowball from 'snowball-stemmers';

const stemmer = snowball.newStemmer('spanish');

/** One normalizer for everything: index, query, quote check, live check. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents; ñ -> n
    .toLowerCase()
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Small Spanish stop-word list (already normalized).
 * Domain words stay searchable on purpose: no, sol, renta, cuarta, clave.
 */
export const STOP_WORDS = new Set(
  (
    'a al algo ante con contra de del desde donde el ella ellos en entre era es esa ese eso esta este esto ' +
    'ha han hay la las le les lo los mas me mi mis muy o para pero por porque que se sea ser si sin sobre ' +
    'su sus te tu tus un una uno unos unas y ya yo como cual cuales cuando debo puedo quiero necesito hago hacer tengo ' +
    'tiene tienen soy estoy esta estan fue son seria'
  ).split(' '),
);

export function tokenize(s: string): string[] {
  return normalize(s).split(/[^a-z0-9]+/).filter(Boolean);
}

/** Term pipeline used by the index AND the query. Returns null to drop the term. */
export function processTerm(term: string): string | null {
  const t = normalize(term);
  if (!t || STOP_WORDS.has(t)) return null;
  if (/^\d+$/.test(t)) return t;
  // The Snowball stemmer needs the accent in "-ción"/"-sión" endings. Words without it
  // (typed without accents, or after normalize) get it back, then the root is normalized again.
  const accented = t.replace(/([cs])ion$/, '$1ión');
  return normalize(stemmer.stem(accented));
}
