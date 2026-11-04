import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy } from '@angular/core';
import { Perfil, ResultadoCompatibilidad } from '../../models/perfil.model';
import { CompatibilidadService, RespuestaExplicacion } from '../../services/compatibilidad.service';
import { LecturaVozService } from '../../services/lectura-voz.service';
import { PerfilService } from '../../services/perfil.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { ComparadorComponent } from '../comparador/comparador.component';

@Component({
  selector: 'app-tarjeta-companero',
  standalone: true,
  imports: [CommonModule, AvatarComponent, ComparadorComponent],
  templateUrl: './tarjeta-companero.component.html'
})
export class TarjetaCompaneroComponent implements OnDestroy {
  @Input({ required: true }) resultado!: ResultadoCompatibilidad;
  @Input({ required: true }) yo!: Perfil;
  @Input() destacada = false;

  explicacionAbierta = false;
  cargandoExplicacion = false;
  errorExplicacion: string | null = null;
  explicacion: RespuestaExplicacion | null = null;
  leyendo = false;

  constructor(
    private perfiles: PerfilService,
    private compatibilidad: CompatibilidadService,
    readonly voz: LecturaVozService
  ) {}

  ngOnDestroy(): void {
    this.detenerLectura();
  }

  get candidato(): Perfil {
    return this.resultado.candidato;
  }

  get foto(): string | null {
    return this.perfiles.urlFoto(this.candidato.foto_url);
  }

  get nivel(): { texto: string; clase: string } {
    const { score } = this.resultado;
    if (score >= 85) return { texto: 'Encajan muy bien', clase: 'alto' };
    if (score >= 65) return { texto: 'Buena opción', clase: 'alto' };
    if (score >= 40) return { texto: 'Hay que conversar', clase: 'medio' };
    return { texto: 'Muy distintos', clase: 'bajo' };
  }

  alternarExplicacion(): void {
    this.detenerLectura();
    this.explicacionAbierta = !this.explicacionAbierta;
    if (!this.explicacionAbierta || this.explicacion || this.cargandoExplicacion) return;

    this.cargandoExplicacion = true;
    this.errorExplicacion = null;
    this.compatibilidad
      .explicar(this.candidato.id, this.resultado.score, this.resultado.coincidencias, this.resultado.conflictos)
      .subscribe({
        next: (respuesta) => {
          this.explicacion = respuesta;
          this.cargandoExplicacion = false;
        },
        error: (err) => {
          this.cargandoExplicacion = false;
          this.errorExplicacion = err.error?.error || 'No se pudo generar la explicación. Cierra y vuelve a intentarlo.';
        }
      });
  }

  alternarLectura(texto: string): void {
    if (this.leyendo) {
      this.detenerLectura();
      return;
    }
    this.leyendo = true;
    this.voz.leer(texto, () => (this.leyendo = false));
  }

  private detenerLectura(): void {
    if (!this.leyendo) return;
    this.voz.detener();
  }
}
