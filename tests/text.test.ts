import { describe, expect, it } from 'vitest';
import { normalize, processTerm } from '../src/lib/text.ts';

describe('normalize', () => {
  it('removes accents, ñ -> n, lower case, collapses spaces', () => {
    expect(normalize('  Declaración   ANUAL  Señor ')).toBe('declaracion anual senor');
  });
  it('maps curly quotes and dashes', () => {
    expect(normalize('“contado” – ‘x’')).toBe('"contado" - \'x\'');
  });
});

describe('processTerm', () => {
  it('gives the same root to word forms', () => {
    expect(processTerm('declaración')).toBe(processTerm('declarar'));
    expect(processTerm('retenciones')).toBe(processTerm('retención'));
    expect(processTerm('recibos')).toBe(processTerm('recibo'));
  });
  it('keeps domain words searchable', () => {
    for (const w of ['no', 'sol', 'renta', 'cuarta', 'clave']) expect(processTerm(w)).not.toBeNull();
  });
  it('drops stop words', () => {
    expect(processTerm('para')).toBeNull();
    expect(processTerm('Cómo')).toBeNull();
  });
  it('keeps numbers', () => {
    expect(processTerm('1609')).toBe('1609');
  });
});
