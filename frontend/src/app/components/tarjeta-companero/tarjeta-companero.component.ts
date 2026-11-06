import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription, skip } from 'rxjs';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { ClaveTexto } from '../../i18n/textos';
import { Perfil, ResultadoCompatibilidad } from '../../models/perfil.model';
import { CompatibilidadService, RespuestaExplicacion } from '../../services/compatibilidad.service';
import { Idioma, IdiomaService } from '../../services/idioma.service';
import { LecturaVozService } from '../../services/lectura-voz.service';
import { PerfilService } from '../../services/perfil.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { ComparadorComponent } from '../comparador/comparador.component';

@Component({
  selector: 'app-tarjeta-companero',
  standalone: true,
  imports: [CommonModule, TraducirPipe, AvatarComponent, ComparadorComponent],
  templateUrl: './tarjeta-companero.component.html'
})
export class TarjetaCompaneroComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resultado!: ResultadoCompatibilidad;
  @Input({ required: true }) yo!: Perfil;
  @Input() destacada = false;

  explicacionAbierta = false;
  cargandoExplicacion = false;
  errorApi: string | null | undefined;
  huboError = false;
  leyendo = false;

  /** La explicación se guarda por idioma, para no pedirla otra vez al volver a uno ya visto. */
  private explicaciones: Partial<Record<Idioma, RespuestaExplicacion>> = {};
  private cambiosIdioma?: Subscription;

  constructor(
    private perfiles: PerfilService,
    private compatibilidad: CompatibilidadService,
    readonly voz: LecturaVozService,
    readonly i18n: IdiomaService
  ) {}

  ngOnInit(): void {
    this.cambiosIdioma = this.i18n.cambios$.pipe(skip(1)).subscribe(() => {
      this.detenerLectura();
      if (this.explicacionAbierta) this.cargarExplicacion();
    });
  }

  ngOnDestroy(): void {
    this.cambiosIdioma?.unsubscribe();
    this.detenerLectura();
  }

  get candidato(): Perfil {
    return this.resultado.candidato;
  }

  get foto(): string | null {
    return this.perfiles.urlFoto(this.candidato.foto_url);
  }

  get explicacion(): RespuestaExplicacion | null {
    return this.explicaciones[this.i18n.idioma] ?? null;
  }

  get errorExplicacion(): string | null {
    return this.huboError ? this.i18n.errorApi(this.errorApi, 'tarjeta.errorExplicacion') : null;
  }

  get nivel(): { texto: ClaveTexto; clase: string } {
    const { score } = this.resultado;
    if (score >= 85) return { texto: 'nivel.muyBien', clase: 'alto' };
    if (score >= 65) return { texto: 'nivel.buena', clase: 'alto' };
    if (score >= 40) return { texto: 'nivel.conversar', clase: 'medio' };
    return { texto: 'nivel.distintos', clase: 'bajo' };
  }

  alternarExplicacion(): void {
    this.detenerLectura();
    this.explicacionAbierta = !this.explicacionAbierta;
    if (this.explicacionAbierta) this.cargarExplicacion();
  }

  alternarLectura(texto: string): void {
    if (this.leyendo) {
      this.detenerLectura();
      return;
    }
    this.leyendo = true;
    this.voz.leer(texto, () => (this.leyendo = false));
  }

  private cargarExplicacion(): void {
    const idioma = this.i18n.idioma;
    this.huboError = false;
    if (this.explicaciones[idioma] || this.cargandoExplicacion) return;

    this.cargandoExplicacion = true;
    this.compatibilidad
      .explicar(this.candidato.id, this.resultado.score, this.resultado.coincidencias, this.resultado.conflictos, idioma)
      .subscribe({
        next: (respuesta) => {
          this.explicaciones[idioma] = respuesta;
          this.cargandoExplicacion = false;
          // Si cambió de idioma mientras esperaba, pide la versión que ahora necesita.
          if (this.explicacionAbierta && this.i18n.idioma !== idioma) this.cargarExplicacion();
        },
        error: (err) => {
          this.cargandoExplicacion = false;
          this.errorApi = err.error?.error;
          this.huboError = true;
        }
      });
  }

  private detenerLectura(): void {
    if (!this.leyendo) return;
    this.voz.detener();
  }
}
