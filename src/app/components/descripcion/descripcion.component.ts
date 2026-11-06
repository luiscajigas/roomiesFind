import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CompatibilidadService } from '../../services/compatibilidad.service';
import { IdiomaService } from '../../services/idioma.service';

/**
 * Descripción escrita por una persona. En inglés se muestra traducida; mientras
 * llega la traducción, o si falla, se ve el texto original.
 */
@Component({
  selector: 'app-descripcion',
  standalone: true,
  template: `{{ traduccion ?? texto }}`
})
export class DescripcionComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) usuarioId!: number;
  @Input({ required: true }) texto!: string;

  traduccion: string | null = null;

  private cambiosIdioma?: Subscription;
  private peticion?: Subscription;

  constructor(private i18n: IdiomaService, private compatibilidad: CompatibilidadService) {}

  ngOnInit(): void {
    this.cambiosIdioma = this.i18n.cambios$.subscribe(() => this.actualizar());
  }

  ngOnChanges(): void {
    if (this.cambiosIdioma) this.actualizar();
  }

  ngOnDestroy(): void {
    this.cambiosIdioma?.unsubscribe();
    this.peticion?.unsubscribe();
  }

  private actualizar(): void {
    this.peticion?.unsubscribe();
    this.traduccion = null;
    if (this.i18n.idioma !== 'en') return;
    this.peticion = this.compatibilidad
      .traducirDescripcion(this.usuarioId, this.texto, 'en')
      .subscribe((traduccion) => (this.traduccion = traduccion));
  }
}
