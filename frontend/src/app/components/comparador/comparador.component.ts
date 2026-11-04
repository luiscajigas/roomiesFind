import { CommonModule, formatNumber } from '@angular/common';
import { Component, Input } from '@angular/core';

/** Lo mínimo que hace falta para comparar a dos personas. */
export interface HabitosComparables {
  nombre: string;
  presupuesto: number;
  limpieza: number;
  tolerancia_ruido: number;
}

interface FilaEscala {
  etiqueta: string;
  minimo: string;
  maximo: string;
  yo: number;
  otro: number;
}

/** Ubica a dos personas en las mismas escalas para ver en qué se parecen. */
@Component({
  selector: 'app-comparador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparador.component.html'
})
export class ComparadorComponent {
  @Input({ required: true }) yo!: HabitosComparables;
  @Input({ required: true }) otro!: HabitosComparables;

  get primerNombre(): string {
    return this.otro.nombre.trim().split(/\s+/)[0];
  }

  get filas(): FilaEscala[] {
    return [
      { etiqueta: 'Orden', minimo: 'Relajado', maximo: 'Muy ordenado', yo: this.yo.limpieza, otro: this.otro.limpieza },
      { etiqueta: 'Ruido', minimo: 'Silencio', maximo: 'No le molesta', yo: this.yo.tolerancia_ruido, otro: this.otro.tolerancia_ruido }
    ];
  }

  posicion(valor: number): number {
    return ((valor - 1) / 4) * 100;
  }

  get presupuestoOtro(): string {
    return formatNumber(this.otro.presupuesto, 'es-CO', '1.0-0');
  }

  get diferenciaPresupuesto(): string {
    const diferencia = this.otro.presupuesto - this.yo.presupuesto;
    if (diferencia === 0) return 'igual que tú';
    const monto = formatNumber(Math.abs(diferencia), 'es-CO', '1.0-0');
    return `$${monto} ${diferencia > 0 ? 'más' : 'menos'} que tú`;
  }
}
