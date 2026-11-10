import type { Perfil, ResultadoCompatibilidad } from '../models/perfil.model';

/**
 * Mensajes entre la página y el Web Worker de compatibilidad. Los dos lados importan
 * estos tipos, así que no pueden desalinearse sin que el compilador lo note.
 *
 * Cada petición lleva un id: el worker es uno solo y puede tener varias en curso.
 */
export interface PeticionCalculo {
  id: number;
  yo: Perfil;
  candidatos: Perfil[];
}

export type RespuestaCalculo =
  | { id: number; ok: true; resultados: ResultadoCompatibilidad[] }
  | { id: number; ok: false; error: string };
