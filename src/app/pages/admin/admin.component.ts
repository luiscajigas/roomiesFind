import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { ClaveTexto } from '../../i18n/textos';
import { AdminService, CuentaReportada, CuentaSuspendida, FichaPersona, ReporteAdmin, ResumenAdmin } from '../../services/admin.service';
import { IdiomaService } from '../../services/idioma.service';
import { TEXTO_MOTIVO } from '../../services/moderacion.service';
import { PerfilService } from '../../services/perfil.service';

type Pestana = 'pendientes' | 'todos' | 'suspendidas';

const TEXTO_ESTADO: Record<ReporteAdmin['estado'], ClaveTexto> = {
  pendiente: 'admin.estadoPendiente',
  revisado: 'admin.estadoRevisado',
  descartado: 'admin.estadoDescartado'
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AppHeaderComponent, AvatarComponent, TraducirPipe],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  pestana: Pestana = 'pendientes';
  resumen: ResumenAdmin | null = null;
  cuentas: CuentaReportada[] = [];
  suspendidas: CuentaSuspendida[] = [];
  cargando = true;
  error = false;
  aviso: ClaveTexto | null = null;
  errorAccion: string | null = null;
  /** Cuenta con una acción en curso, para desactivar sus botones. */
  ocupada: number | null = null;
  /** Cuenta cuyo formulario de suspensión está abierto. */
  suspendiendo: number | null = null;
  motivoSuspension = '';

  constructor(
    private admin: AdminService,
    private perfiles: PerfilService,
    readonly i18n: IdiomaService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cambiar(pestana: Pestana): void {
    if (pestana === this.pestana) return;
    this.pestana = pestana;
    this.aviso = null;
    this.errorAccion = null;
    this.suspendiendo = null;
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = false;
    const lista = this.pestana === 'suspendidas' ? this.admin.suspendidas() : this.admin.reportes(this.pestana);
    forkJoin({ resumen: this.admin.resumen(), lista }).subscribe({
      next: ({ resumen, lista }) => {
        this.resumen = resumen;
        if (this.pestana === 'suspendidas') this.suspendidas = lista as CuentaSuspendida[];
        else this.cuentas = lista as CuentaReportada[];
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  foto(persona: FichaPersona): string | null {
    return this.perfiles.urlFoto(persona.foto_url);
  }

  textoMotivo(reporte: ReporteAdmin): ClaveTexto {
    return TEXTO_MOTIVO[reporte.motivo] ?? 'moderar.motivoOtro';
  }

  textoEstado(reporte: ReporteAdmin): ClaveTexto {
    return TEXTO_ESTADO[reporte.estado];
  }

  pendientes(cuenta: CuentaReportada): number {
    return cuenta.reportes.filter((reporte) => reporte.estado === 'pendiente').length;
  }

  vigentes(cuenta: CuentaReportada): number {
    return cuenta.reportes.filter((reporte) => reporte.estado !== 'descartado').length;
  }

  get localeFechas(): string {
    return this.i18n.idioma === 'en' ? 'en-US' : 'es-CO';
  }

  descartar(cuenta: CuentaReportada): void {
    this.ejecutar(cuenta.persona.id, this.admin.descartar(cuenta.persona.id), 'admin.avisoDescartado');
  }

  mantener(cuenta: CuentaReportada): void {
    this.ejecutar(cuenta.persona.id, this.admin.mantener(cuenta.persona.id), 'admin.avisoMantenido');
  }

  abrirSuspension(id: number): void {
    this.suspendiendo = id;
    this.motivoSuspension = '';
    this.errorAccion = null;
  }

  suspender(id: number): void {
    if (!this.motivoSuspension.trim()) return;
    this.ejecutar(id, this.admin.suspender(id, this.motivoSuspension.trim()), 'admin.avisoSuspendida');
  }

  reactivar(id: number): void {
    this.ejecutar(id, this.admin.reactivar(id), 'admin.avisoReactivada');
  }

  private ejecutar(id: number, accion: ReturnType<AdminService['descartar']>, aviso: ClaveTexto): void {
    this.ocupada = id;
    this.aviso = null;
    this.errorAccion = null;
    accion.subscribe({
      next: () => {
        this.ocupada = null;
        this.suspendiendo = null;
        this.aviso = aviso;
        this.cargar();
      },
      error: (error) => {
        this.ocupada = null;
        this.errorAccion = this.i18n.errorApi(error.error?.error, 'admin.errorAccion');
      }
    });
  }
}
