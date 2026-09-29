/// <reference lib="webworker" />

/**
 * Motor de compatibilidad. Corre en un hilo separado del hilo principal
 * (Web Worker) para que, cuando exista una gran cantidad de perfiles, el
 * cálculo de todas las comparaciones no bloquee la interfaz del usuario.
 *
 * IMPORTANTE (decisión de diseño del proyecto): este cálculo es 100%
 * basado en reglas objetivas, NO en IA. La IA solo interviene después,
 * para interpretar en lenguaje natural un resultado que ya fue calculado
 * aquí -así se reduce el consumo de tokens y el resultado del match es
 * siempre reproducible/objetivo-.
 */

interface Perfil {
  id: number;
  nombre: string;
  presupuesto: number;
  zona: string;
  horario: 'madrugador' | 'nocturno' | 'mixto';
  limpieza: number;
  tolerancia_ruido: number;
  frecuencia_visitas: 'nunca' | 'ocasional' | 'frecuente';
  tiene_mascotas: boolean;
  acepta_mascotas: boolean;
}

interface EntradaWorker {
  yo: Perfil;
  candidatos: Perfil[];
}

function calcularCompatibilidad(yo: Perfil, candidato: Perfil) {
  const coincidencias: string[] = [];
  const conflictos: string[] = [];
  let puntos = 0;

  // Presupuesto (15 pts): entre más cercanos, mejor.
  const diferenciaPresupuesto = Math.abs(yo.presupuesto - candidato.presupuesto);
  if (diferenciaPresupuesto <= 50000) {
    puntos += 15;
    coincidencias.push('Presupuestos muy similares');
  } else if (diferenciaPresupuesto <= 150000) {
    puntos += 8;
  } else {
    conflictos.push('Presupuestos bastante distintos');
  }

  // Zona (20 pts): exacta o nada, es la más determinante para convivir.
  if (yo.zona.trim().toLowerCase() === candidato.zona.trim().toLowerCase()) {
    puntos += 20;
    coincidencias.push(`Ambos buscan en ${candidato.zona}`);
  } else {
    conflictos.push(`Zonas distintas (${yo.zona} vs ${candidato.zona})`);
  }

  // Horario (15 pts)
  if (yo.horario === candidato.horario) {
    puntos += 15;
    coincidencias.push('Tienen horarios similares');
  } else if (yo.horario === 'mixto' || candidato.horario === 'mixto') {
    puntos += 8;
  } else {
    conflictos.push('Horarios opuestos (uno madruga, el otro trasnocha)');
  }

  // Limpieza (15 pts): escala 1-5
  const diferenciaLimpieza = Math.abs(yo.limpieza - candidato.limpieza);
  if (diferenciaLimpieza <= 1) {
    puntos += 15;
    coincidencias.push('Coinciden en hábitos de limpieza');
  } else if (diferenciaLimpieza <= 2) {
    puntos += 7;
  } else {
    conflictos.push('Niveles de orden/limpieza muy distintos');
  }

  // Tolerancia al ruido (15 pts)
  const diferenciaRuido = Math.abs(yo.tolerancia_ruido - candidato.tolerancia_ruido);
  if (diferenciaRuido <= 1) {
    puntos += 15;
    coincidencias.push('Ambos prefieren un nivel de ruido similar');
  } else if (diferenciaRuido <= 2) {
    puntos += 7;
  } else {
    conflictos.push('Uno prefiere silencio y el otro tolera más ruido');
  }

  // Frecuencia de visitas (10 pts)
  const escalaVisitas: Record<string, number> = { nunca: 0, ocasional: 1, frecuente: 2 };
  const diferenciaVisitas = Math.abs(escalaVisitas[yo.frecuencia_visitas] - escalaVisitas[candidato.frecuencia_visitas]);
  if (diferenciaVisitas === 0) {
    puntos += 10;
    coincidencias.push('Frecuencia de visitas similar');
  } else if (diferenciaVisitas === 1) {
    puntos += 5;
  } else {
    conflictos.push('El otro usuario recibe visitas con mucha más frecuencia');
  }

  // Mascotas (10 pts)
  if (yo.tiene_mascotas && !candidato.acepta_mascotas) {
    conflictos.push('Tú tienes mascota y el candidato no las acepta');
  } else if (candidato.tiene_mascotas && !yo.acepta_mascotas) {
    conflictos.push('El candidato tiene mascota y tú no las aceptas');
  } else {
    puntos += 10;
    if (yo.tiene_mascotas || candidato.tiene_mascotas) {
      coincidencias.push('Sin conflicto por mascotas');
    }
  }

  return {
    candidato,
    score: Math.round(puntos),
    coincidencias,
    conflictos
  };
}

addEventListener('message', ({ data }: { data: EntradaWorker }) => {
  const { yo, candidatos } = data;

  const resultados = candidatos
    .map((candidato) => calcularCompatibilidad(yo, candidato))
    .sort((a, b) => b.score - a.score);

  postMessage(resultados);
});
