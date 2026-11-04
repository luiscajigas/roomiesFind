import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Selector de 1 a 5 con el significado de cada extremo. */
@Component({
  selector: 'app-escala',
  standalone: true,
  imports: [CommonModule],
  template: `
    <fieldset class="escala">
      <legend>{{ etiqueta }}</legend>
      <div class="escala__opciones">
        <label *ngFor="let opcion of opciones" class="escala__opcion" [class.escala__opcion--activa]="valor === opcion">
          <input type="radio" [name]="nombre" [value]="opcion" [checked]="valor === opcion" (change)="elegir(opcion)" />
          <span>{{ opcion }}</span>
        </label>
      </div>
      <div class="escala__extremos"><span>{{ minimo }}</span><span>{{ maximo }}</span></div>
    </fieldset>
  `
})
export class EscalaComponent {
  @Input({ required: true }) nombre!: string;
  @Input({ required: true }) etiqueta!: string;
  @Input({ required: true }) minimo!: string;
  @Input({ required: true }) maximo!: string;
  @Input() valor = 3;
  @Output() valorChange = new EventEmitter<number>();

  readonly opciones = [1, 2, 3, 4, 5];

  elegir(opcion: number): void {
    this.valor = opcion;
    this.valorChange.emit(opcion);
  }
}
