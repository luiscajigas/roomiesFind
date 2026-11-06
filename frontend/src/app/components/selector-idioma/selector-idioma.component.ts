import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { Idioma, IdiomaService } from '../../services/idioma.service';

/** Botones para cambiar entre español e inglés. */
@Component({
  selector: 'app-selector-idioma',
  standalone: true,
  imports: [CommonModule, TraducirPipe],
  template: `
    <div class="selector-idioma" role="group" [attr.aria-label]="'idioma.cambiar' | t">
      <button *ngFor="let opcion of opciones" type="button" [attr.lang]="opcion.codigo"
        [attr.aria-label]="opcion.nombre"
        [attr.aria-pressed]="i18n.idioma === opcion.codigo"
        [class.selector-idioma__opcion--activa]="i18n.idioma === opcion.codigo"
        (click)="i18n.cambiar(opcion.codigo)">{{ opcion.etiqueta }}</button>
    </div>
  `
})
export class SelectorIdiomaComponent {
  readonly opciones: { codigo: Idioma; etiqueta: string; nombre: string }[] = [
    { codigo: 'es', etiqueta: 'ES', nombre: 'Español' },
    { codigo: 'en', etiqueta: 'EN', nombre: 'English' }
  ];

  constructor(readonly i18n: IdiomaService) {}
}
