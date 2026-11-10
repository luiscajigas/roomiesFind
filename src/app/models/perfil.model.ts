import { Persona } from '../api/tipos';

/** Una persona con su perfil, tal como la envía el API (ver api/tipos.ts). */
export type Perfil = Persona;

export interface ResultadoCompatibilidad {
  candidato: Perfil;
  score: number;
  coincidencias: string[];
  conflictos: string[];
}
