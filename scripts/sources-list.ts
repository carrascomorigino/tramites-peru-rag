// Candidate official pages for version 1. Topic ids match the plan (section 2).
export interface Candidate {
  id: string;
  topic: 'ruc' | 'clave-sol' | 'rhe' | 'suspension' | 'anual';
  url: string;
}

export const candidates: Candidate[] = [
  { id: 'gobpe-inscripcion-ruc', topic: 'ruc', url: 'https://www.gob.pe/284-inscripcion-en-el-ruc' },
  { id: 'orient-inscribete-ruc', topic: 'ruc', url: 'https://orientacion.sunat.gob.pe/1097-0-inscribete-en-el-ruc' },
  { id: 'gobpe-obtener-clave-sol', topic: 'clave-sol', url: 'https://www.gob.pe/393-obtener-clave-sol' },
  { id: 'orient-clave-sol', topic: 'clave-sol', url: 'https://orientacion.sunat.gob.pe/1088-clave-sol-obtencion-recuperacion' },
  { id: 'orient-requisitos-clave-sol', topic: 'clave-sol', url: 'https://orientacion.sunat.gob.pe/6614-02-requisitos-para-obtener-la-clave-sol' },
  { id: 'gobpe-emitir-rhe', topic: 'rhe', url: 'https://www.gob.pe/1101-emitir-recibo-por-honorarios-electronico' },
  { id: 'orient-otras-obligaciones', topic: 'rhe', url: 'https://orientacion.sunat.gob.pe/3069-07-otras-obligaciones-personas' },
  { id: 'gobpe-tipos-cpe', topic: 'rhe', url: 'https://www.gob.pe/26395-tipos-de-comprobante-de-pago-electronicos' },
  { id: 'gobpe-suspension-1609', topic: 'suspension', url: 'https://www.gob.pe/8017-solicitar-la-suspension-de-retenciones-de-cuarta-categoria-formulario-n-1609' },
  { id: 'gobpe-declarar-anual', topic: 'anual', url: 'https://www.gob.pe/12274-declarar-y-pagar-impuesto-anual-para-rentas-de-trabajo-4ta-y-5ta-categoria' },
  { id: 'gobpe-rentas-cuarta', topic: 'anual', url: 'https://www.gob.pe/8016-rentas-de-cuarta-categoria-trabajo-independiente' },
  { id: 'gobpe-calcular-cuarta', topic: 'anual', url: 'https://www.gob.pe/7318-calcular-el-impuesto-a-la-renta-de-cuarta-categoria' },
];
