import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { DescripcionComponent } from '../../components/descripcion/descripcion.component';
import { TarjetaCompaneroComponent } from '../../components/tarjeta-companero/tarjeta-companero.component';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { IdiomaService } from '../../services/idioma.service';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { CompatibilidadService } from '../../services/compatibilidad.service';
import { Perfil, ResultadoCompatibilidad } from '../../models/perfil.model';
import { NIVELES, NivelCompatibilidad, nivelDe } from '../../utils/nivel-compatibilidad';

const PUNTAJE_BUENA_OPCION = 65;
const OTRAS_EN_INICIO = 6;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AppHeaderComponent, AvatarComponent, DescripcionComponent, TarjetaCompaneroComponent, TraducirPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  miPerfil: Perfil | null = null;
  resultados: ResultadoCompatibilidad[] = [];
  cargando = true;
  hayErrorCarga = false;
  fotoSubiendo = false;
  errorFoto: string | null = null;
  private versionFoto = Date.now();

  private worker: Worker | null = null;

  constructor(
    private perfilService: PerfilService,
    private compatibilidadService: CompatibilidadService,
    private auth: AuthService,
    readonly i18n: IdiomaService
  ) {}

  ngOnInit(): void {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('../../workers/compatibilidad.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        this.resultados = data;
        this.cargando = false;
        // Registramos cada score calculado, para el historial/analítica del backend.
        for (const r of data as ResultadoCompatibilidad[]) {
          this.compatibilidadService.registrar(r.candidato.id, r.score).subscribe({ error: () => {} });
        }
      };
    }

    forkJoin({
      miPerfil: this.perfilService.miPerfil(),
      candidatos: this.perfilService.candidatos()
    }).subscribe({
      next: ({ miPerfil, candidatos }) => {
        this.miPerfil = miPerfil;
        if (this.worker) {
          this.worker.postMessage({ yo: miPerfil, candidatos });
        } else {
          this.cargando = false;
        }
      },
      error: () => {
        this.hayErrorCarga = true;
        this.cargando = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
  }

  get nombre(): string {
    return this.usuario?.nombre || this.i18n.t('inicio.tuPerfil');
  }

  get titulo(): string {
    const primerNombre = this.nombre.trim().split(/\s+/)[0];
    const buenas = this.resultados.filter((r) => r.score >= PUNTAJE_BUENA_OPCION).length;
    if (this.cargando || buenas === 0) return this.i18n.t('inicio.hola', { nombre: primerNombre });
    return buenas === 1
      ? this.i18n.t('inicio.una', { nombre: primerNombre })
      : this.i18n.t('inicio.varias', { nombre: primerNombre, cantidad: buenas });
  }

  /** Cuántas personas hay en cada nivel de compatibilidad. */
  get resumen(): { nivel: NivelCompatibilidad; cantidad: number }[] {
    return NIVELES
      .map((nivel) => ({ nivel, cantidad: this.resultados.filter((r) => nivelDe(r.score).id === nivel.id).length }))
      .filter((fila) => fila.cantidad > 0);
  }

  get mejorOpcion(): ResultadoCompatibilidad | null {
    return this.resultados[0] ?? null;
  }

  get otrasOpciones(): ResultadoCompatibilidad[] {
    return this.resultados.slice(1, 1 + OTRAS_EN_INICIO);
  }

  get hayMasOpciones(): boolean {
    return this.resultados.length > 1 + OTRAS_EN_INICIO;
  }

  irASeccion(id: string): void {
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }

  get usuario() {
    return this.auth.usuarioActual;
  }

  urlFoto(fotoUrl: string | null | undefined): string | null {
    return this.perfilService.urlFoto(fotoUrl, this.versionFoto);
  }

  actualizarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const foto = input.files?.[0];
    if (!foto) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposPermitidos.includes(foto.type)) {
      this.errorFoto = this.i18n.t('foto.tipo');
      input.value = '';
      return;
    }
    if (foto.size > 5 * 1024 * 1024) {
      this.errorFoto = this.i18n.t('foto.peso');
      input.value = '';
      return;
    }

    this.fotoSubiendo = true;
    this.errorFoto = null;
    this.perfilService.actualizarFoto(foto).subscribe({
      next: ({ foto_url }) => {
        if (this.miPerfil) {
          this.miPerfil = { ...this.miPerfil, foto_url };
        }
        this.versionFoto = Date.now();
        this.fotoSubiendo = false;
        input.value = '';
      },
      error: (error) => {
        this.errorFoto = this.i18n.errorApi(error.error?.error, 'foto.error');
        this.fotoSubiendo = false;
        input.value = '';
      }
    });
  }
}
