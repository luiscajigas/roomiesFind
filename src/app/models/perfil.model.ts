export interface Perfil {
  id: number;              // usuario_id
  nombre: string;
  usuario_id: number;
  presupuesto: number;
  zona: string;
  horario: 'madrugador' | 'nocturno' | 'mixto';
  limpieza: number;
  tolerancia_ruido: number;
  frecuencia_visitas: 'nunca' | 'ocasional' | 'frecuente';
  tiene_mascotas: boolean;
  acepta_mascotas: boolean;
  descripcion?: string;
  foto_url?: string | null;
}

export interface ResultadoCompatibilidad {
  candidato: Perfil;
  score: number;
  coincidencias: string[];
  conflictos: string[];
}
