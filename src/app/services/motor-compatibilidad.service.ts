import { Injectable, OnDestroy } from '@angular/core';
import { Perfil, ResultadoCompatibilidad } from '../models/perfil.model';
import type { PeticionCalculo, RespuestaCalculo } from '../workers/compatibilidad.mensajes';

interface Pendiente {
  resolver: (resultados: ResultadoCompatibilidad[]) => void;
  rechazar: (error: Error) => void;
}

/**
 * Calcula en un Web Worker el detalle de compatibilidad de cada persona de una página,
 * para no bloquear la interfaz. Hay un solo worker para toda la app: se crea la primera
 * vez que se necesita (no al cargar la página, ni en el servidor durante el prerenderizado)
 * y se reutiliza entre páginas.
 */
@Injectable({ providedIn: 'root' })
export class MotorCompatibilidadService implements OnDestroy {
  private worker: Worker | null = null;
  private readonly pendientes = new Map<number, Pendiente>();
  private siguiente = 0;

  calcular(yo: Perfil, candidatos: Perfil[]): Promise<ResultadoCompatibilidad[]> {
    return new Promise((resolver, rechazar) => {
      const worker = this.obtenerWorker();
      if (!worker) {
        rechazar(new Error('Este navegador no permite iniciar el cálculo.'));
        return;
      }
      const id = ++this.siguiente;
      this.pendientes.set(id, { resolver, rechazar });
      const peticion: PeticionCalculo = { id, yo, candidatos };
      worker.postMessage(peticion);
    });
  }

  ngOnDestroy(): void {
    this.fallarTodo(new Error('Se cerró el cálculo de compatibilidad.'));
    this.worker?.terminate();
    this.worker = null;
  }

  private obtenerWorker(): Worker | null {
    if (this.worker || typeof Worker === 'undefined') return this.worker;
    this.worker = new Worker(new URL('../workers/compatibilidad.worker', import.meta.url));
    this.worker.onmessage = ({ data }: MessageEvent<RespuestaCalculo>) => {
      const pendiente = this.pendientes.get(data.id);
      this.pendientes.delete(data.id);
      if (data.ok) pendiente?.resolver(data.resultados);
      else pendiente?.rechazar(new Error(data.error));
    };
    // Si el worker no carga o se cae, nadie debe quedarse esperando; el próximo intento crea otro.
    this.worker.onerror = () => {
      this.fallarTodo(new Error('Falló el cálculo de compatibilidad.'));
      this.worker?.terminate();
      this.worker = null;
    };
    return this.worker;
  }

  private fallarTodo(error: Error): void {
    this.pendientes.forEach((pendiente) => pendiente.rechazar(error));
    this.pendientes.clear();
  }
}
