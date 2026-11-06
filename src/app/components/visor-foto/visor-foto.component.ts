import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { TraducirPipe } from '../../i18n/traducir.pipe';

/**
 * Muestra una foto en grande. Usa <dialog>, que ya cierra con Escape, mantiene
 * el foco dentro y lo devuelve al botón que lo abrió.
 */
@Component({
  selector: 'app-visor-foto',
  standalone: true,
  imports: [TraducirPipe],
  template: `
    <dialog #dialogo class="visor-foto" [attr.aria-label]="'tarjeta.foto' | t: { nombre: nombre }"
      (click)="alHacerClic($event)" (close)="cerrado.emit()">
      <div class="visor-foto__contenido">
        <button class="visor-foto__cerrar" type="button" [attr.aria-label]="'visor.cerrar' | t" (click)="cerrar()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <img [src]="foto" [alt]="'tarjeta.foto' | t: { nombre: nombre }" referrerpolicy="no-referrer" (error)="cerrar()" />
        <p class="visor-foto__nombre">{{ nombre }}</p>
      </div>
    </dialog>
  `
})
export class VisorFotoComponent implements AfterViewInit {
  @Input({ required: true }) foto!: string;
  @Input({ required: true }) nombre!: string;
  @Output() cerrado = new EventEmitter<void>();

  @ViewChild('dialogo') private dialogo!: ElementRef<HTMLDialogElement>;

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  cerrar(): void {
    this.dialogo.nativeElement.close();
  }

  /** Un clic en el propio <dialog> es un clic en el fondo, fuera de la foto. */
  alHacerClic(evento: MouseEvent): void {
    if (evento.target === this.dialogo.nativeElement) this.cerrar();
  }
}
