import { CommonModule, formatNumber } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { IdiomaService } from '../../services/idioma.service';

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
  imports: [CommonModule, TraducirPipe],
  templateUrl: './comparador.component.html'
})
export class ComparadorComponent {
  @Input({ required: true }) yo!: HabitosComparables;
  @Input({ required: true }) otro!: HabitosComparables;

  constructor(private i18n: IdiomaService) {}

  get primerNombre(): string {
    return this.otro.nombre.trim().split(/\s+/)[0];
  }

  get filas(): FilaEscala[] {
    return [
      { etiqueta: this.i18n.t('dato.orden'), minimo: this.i18n.t('form.relajado'), maximo: this.i18n.t('form.muyOrdenado'), yo: this.yo.limpieza, otro: this.otro.limpieza },
      { etiqueta: this.i18n.t('dato.ruido'), minimo: this.i18n.t('comparador.silencio'), maximo: this.i18n.t('comparador.noMolesta'), yo: this.yo.tolerancia_ruido, otro: this.otro.tolerancia_ruido }
    ];
  }

  posicion(valor: number): number {
    return ((valor - 1) / 4) * 100;
  }

  aria(fila: FilaEscala): string {
    return this.i18n.t('comparador.aria', { etiqueta: fila.etiqueta, yo: fila.yo, otro: this.primerNombre, valor: fila.otro });
  }

  get presupuestoOtro(): string {
    return formatNumber(this.otro.presupuesto, 'es-CO', '1.0-0');
  }

  get diferenciaPresupuesto(): string {
    const diferencia = this.otro.presupuesto - this.yo.presupuesto;
    if (diferencia === 0) return this.i18n.t('comparador.igual');
    const monto = formatNumber(Math.abs(diferencia), 'es-CO', '1.0-0');
    return this.i18n.t(diferencia > 0 ? 'comparador.mas' : 'comparador.menos', { monto });
  }
}
