import { Pipe, PipeTransform } from '@angular/core';
import { IdiomaService } from '../services/idioma.service';
import { ClaveTexto } from './textos';

/** Muestra un texto en el idioma activo. No es puro: debe actualizarse al cambiar de idioma. */
@Pipe({ name: 't', standalone: true, pure: false })
export class TraducirPipe implements PipeTransform {
  constructor(private idioma: IdiomaService) {}

  transform(clave: ClaveTexto, parametros?: Record<string, string | number>): string {
    return this.idioma.t(clave, parametros);
  }
}
