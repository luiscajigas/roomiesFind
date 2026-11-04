import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { COMUNAS_PASTO, OTRO_BARRIO, buscarBarrios, normalizarTexto } from '../../data/barrios-pasto';

interface Opcion {
  valor: string;
  etiqueta: string;
  /** Texto a la derecha de la opción (la comuna, al buscar). */
  detalle: string | null;
  /** Título de comuna que va antes de esta opción, en la lista completa. */
  encabezado: string | null;
  /** Partes del nombre para resaltar lo que coincide con lo escrito. */
  antes: string;
  resaltado: string;
  despues: string;
}

/** Campo para elegir un barrio de Pasto: se escribe y va sugiriendo opciones. */
@Component({
  selector: 'app-selector-barrio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selector-barrio.component.html'
})
export class SelectorBarrioComponent implements OnChanges {
  @Input({ required: true }) idCampo!: string;
  @Input() valor = '';
  /** Zona escrita a mano en una cuenta antigua, para no perderla al editar. */
  @Input() zonaActual: string | null = null;
  @Output() valorChange = new EventEmitter<string>();

  abierto = false;
  /** Lo que la persona escribió; null mientras no ha escrito nada. */
  consulta: string | null = null;
  opciones: Opcion[] = [];
  activa = 0;

  constructor(private anfitrion: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    this.actualizarOpciones();
  }

  get texto(): string {
    return this.consulta ?? this.valor;
  }

  get idLista(): string {
    return `${this.idCampo}-lista`;
  }

  idOpcion(indice: number): string {
    return `${this.idCampo}-opcion-${indice}`;
  }

  /** La última opción siempre es "Otro barrio": si es la única, nada coincidió. */
  get sinCoincidencias(): boolean {
    return this.consulta !== null && this.opciones.length === 1;
  }

  abrir(): void {
    if (this.abierto) return;
    this.abierto = true;
    this.consulta = null;
    this.actualizarOpciones();
    this.activa = Math.max(0, this.opciones.findIndex((opcion) => opcion.valor === this.valor));
    this.mostrarActiva();
  }

  alEnfocar(campo: HTMLInputElement): void {
    this.abrir();
    campo.select();
    // En celular, sube el campo para que el teclado no tape las sugerencias.
    if (window.matchMedia('(max-width: 640px)').matches) {
      campo.scrollIntoView({ block: 'start' });
    }
  }

  alEscribir(texto: string): void {
    this.abierto = true;
    this.consulta = texto;
    this.actualizarOpciones();
    this.activa = 0;
    this.mostrarActiva();
  }

  alPresionarTecla(evento: KeyboardEvent): void {
    switch (evento.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        evento.preventDefault();
        if (!this.abierto) {
          this.abrir();
          return;
        }
        this.moverActiva(evento.key === 'ArrowDown' ? 1 : -1);
        break;
      case 'Enter':
        // Dentro de un formulario, Enter elige el barrio en vez de enviarlo.
        if (this.abierto) {
          evento.preventDefault();
          this.elegir(this.opciones[this.activa]);
        }
        break;
      case 'Tab':
        if (this.abierto && this.consulta && !this.sinCoincidencias) {
          this.elegir(this.opciones[this.activa]);
        }
        break;
      case 'Escape':
        if (this.abierto) {
          evento.stopPropagation();
          this.cerrar();
        }
        break;
    }
  }

  alSalir(evento: FocusEvent): void {
    const destino = evento.relatedTarget as Node | null;
    if (!destino || !this.anfitrion.nativeElement.contains(destino)) {
      this.cerrar();
    }
  }

  elegir(opcion: Opcion): void {
    this.valor = opcion.valor;
    this.valorChange.emit(opcion.valor);
    this.cerrar();
  }

  /** Cierra sin cambiar el barrio: lo escrito sin elegir se descarta. */
  private cerrar(): void {
    this.abierto = false;
    this.consulta = null;
  }

  private moverActiva(paso: number): void {
    const total = this.opciones.length;
    this.activa = (this.activa + paso + total) % total;
    this.mostrarActiva();
  }

  private mostrarActiva(): void {
    setTimeout(() => {
      document.getElementById(this.idOpcion(this.activa))?.scrollIntoView({ block: 'nearest' });
    });
  }

  private actualizarOpciones(): void {
    const opciones = this.consulta?.trim() ? this.opcionesBuscadas(this.consulta) : this.todasLasOpciones();
    this.opciones = [...opciones, this.opcionSimple(OTRO_BARRIO)];
  }

  private todasLasOpciones(): Opcion[] {
    const opciones = this.zonaActual ? [this.opcionSimple(this.zonaActual, 'actual')] : [];
    for (const comuna of COMUNAS_PASTO) {
      comuna.barrios.forEach((barrio, indice) => {
        opciones.push({ ...this.opcionSimple(barrio), encabezado: indice === 0 ? comuna.nombre : null });
      });
    }
    return opciones;
  }

  private opcionesBuscadas(consulta: string): Opcion[] {
    const buscado = normalizarTexto(consulta);
    return buscarBarrios(consulta).map(({ barrio, comuna }) => {
      // Normalizar no cambia el largo de estos nombres, así que las posiciones coinciden.
      const inicio = normalizarTexto(barrio).indexOf(buscado);
      const fin = inicio + buscado.length;
      return inicio < 0
        ? { ...this.opcionSimple(barrio), detalle: comuna }
        : {
            ...this.opcionSimple(barrio),
            detalle: comuna,
            antes: barrio.slice(0, inicio),
            resaltado: barrio.slice(inicio, fin),
            despues: barrio.slice(fin)
          };
    });
  }

  private opcionSimple(valor: string, detalle: string | null = null): Opcion {
    return { valor, etiqueta: valor, detalle, encabezado: null, antes: valor, resaltado: '', despues: '' };
  }
}
