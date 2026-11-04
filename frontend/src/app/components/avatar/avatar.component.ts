import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

const TONOS = ['--accent-2', '--accent', '--yellow', '--red'];

/** Foto de una persona o, si no tiene, sus iniciales sobre un color propio. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="avatar" [ngClass]="'avatar--' + tamano" [style.--tono]="tono">
      <span aria-hidden="true">{{ iniciales }}</span>
      <img *ngIf="foto && !fotoFallida" [src]="foto" [alt]="alt" loading="lazy"
        referrerpolicy="no-referrer" (error)="fotoFallida = true" />
    </span>
  `
})
export class AvatarComponent {
  @Input() nombre = '';
  @Input() alt = '';
  @Input() tamano: 's' | 'm' | 'l' = 'm';

  fotoFallida = false;
  private fotoActual: string | null = null;

  @Input()
  set foto(valor: string | null | undefined) {
    this.fotoActual = valor ?? null;
    this.fotoFallida = false;
  }
  get foto(): string | null {
    return this.fotoActual;
  }

  get iniciales(): string {
    return this.nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map((parte) => parte.charAt(0)).join('').toUpperCase() || '?';
  }

  /** La misma persona conserva siempre su color. */
  get tono(): string {
    const suma = [...this.nombre].reduce((total, letra) => total + letra.charCodeAt(0), 0);
    return `var(${TONOS[suma % TONOS.length]})`;
  }
}
