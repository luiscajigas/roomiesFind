import { ClaveTexto } from '../i18n/textos';

export interface NivelCompatibilidad {
  id: 'muy-bien' | 'buena' | 'conversar' | 'distintos';
  texto: ClaveTexto;
  /** Tono del puntaje en la tarjeta. */
  clase: 'alto' | 'medio' | 'bajo';
  minimo: number;
}

export const NIVELES: NivelCompatibilidad[] = [
  { id: 'muy-bien', texto: 'nivel.muyBien', clase: 'alto', minimo: 85 },
  { id: 'buena', texto: 'nivel.buena', clase: 'alto', minimo: 65 },
  { id: 'conversar', texto: 'nivel.conversar', clase: 'medio', minimo: 40 },
  { id: 'distintos', texto: 'nivel.distintos', clase: 'bajo', minimo: 0 }
];

export function nivelDe(score: number): NivelCompatibilidad {
  return NIVELES.find((nivel) => score >= nivel.minimo) ?? NIVELES[NIVELES.length - 1];
}
