import { Perfil, ResultadoCompatibilidad } from '../models/perfil.model';

/** Calcula en el Web Worker el detalle de cada persona de una página. */
export class MotorCompatibilidad {
  private readonly worker = typeof Worker !== 'undefined'
    ? new Worker(new URL('../workers/compatibilidad.worker', import.meta.url))
    : null;
  private readonly pendientes = new Map<number, (resultados: ResultadoCompatibilidad[]) => void>();
  private siguiente = 0;

  constructor() {
    if (!this.worker) return;
    this.worker.onmessage = ({ data }) => {
      this.pendientes.get(data.id)?.(data.resultados);
      this.pendientes.delete(data.id);
    };
  }

  calcular(yo: Perfil, candidatos: Perfil[]): Promise<ResultadoCompatibilidad[]> {
    return new Promise((resolver, rechazar) => {
      if (!this.worker) {
        rechazar(new Error('Este navegador no permite iniciar el cálculo.'));
        return;
      }
      const id = ++this.siguiente;
      this.pendientes.set(id, resolver);
      this.worker.postMessage({ id, yo, candidatos });
    });
  }

  terminar(): void {
    this.worker?.terminate();
    this.pendientes.clear();
  }
}
