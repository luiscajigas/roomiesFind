import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { EscalaComponent } from '../../components/escala/escala.component';
import { PersonasBloqueadasComponent } from '../../components/personas-bloqueadas/personas-bloqueadas.component';
import { SelectorBarrioComponent } from '../../components/selector-barrio/selector-barrio.component';
import { esBarrioDeLaLista } from '../../data/barrios-pasto';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { IdiomaService } from '../../services/idioma.service';
import { Perfil } from '../../models/perfil.model';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';

type PerfilEditable = Pick<Perfil,
  'presupuesto' | 'zona' | 'horario' | 'limpieza' | 'tolerancia_ruido' |
  'frecuencia_visitas' | 'tiene_mascotas' | 'acepta_mascotas' | 'descripcion'>;

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppHeaderComponent, AvatarComponent, EscalaComponent, PersonasBloqueadasComponent, SelectorBarrioComponent, TraducirPipe],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {
  /** Zona escrita a mano antes de existir la lista; se conserva hasta que elija un barrio. */
  zonaAnterior: string | null = null;
  perfil: Perfil | null = null;
  formulario: PerfilEditable | null = null;
  cargando = true;
  guardando = false;
  fotoSubiendo = false;
  error: string | null = null;
  exito: string | null = null;
  fotoVersion = Date.now();

  constructor(
    private perfilService: PerfilService,
    private auth: AuthService,
    readonly i18n: IdiomaService
  ) {}

  ngOnInit(): void {
    this.perfilService.miPerfil().subscribe({
      next: (perfil) => {
        this.perfil = perfil;
        this.formulario = this.extraerFormulario(perfil);
        this.cargando = false;
      },
      error: () => {
        this.error = this.i18n.t('companeros.errorPerfil');
        this.cargando = false;
      }
    });
  }

  get nombre(): string {
    return this.auth.usuarioActual?.nombre || this.perfil?.nombre || this.i18n.t('perfil.titulo');
  }

  get fotoSrc(): string | null {
    return this.perfilService.urlFoto(this.perfil?.foto_url, this.fotoVersion);
  }

  guardar(): void {
    if (!this.formulario || this.guardando) return;
    this.guardando = true;
    this.error = null;
    this.exito = null;
    this.perfilService.actualizar(this.formulario).subscribe({
      next: (perfil) => {
        this.perfil = { ...this.perfil, ...perfil };
        this.formulario = this.extraerFormulario(this.perfil);
        this.guardando = false;
        this.exito = this.i18n.t('perfil.guardado');
      },
      error: (error) => {
        this.guardando = false;
        this.error = this.i18n.errorApi(error.error?.error, 'perfil.errorGuardar');
      }
    });
  }

  actualizarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const foto = input.files?.[0];
    if (!foto) return;

    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!permitidos.includes(foto.type)) {
      this.error = this.i18n.t('foto.tipo');
      input.value = '';
      return;
    }
    if (foto.size > 5 * 1024 * 1024) {
      this.error = this.i18n.t('foto.peso');
      input.value = '';
      return;
    }

    this.fotoSubiendo = true;
    this.error = null;
    this.exito = null;
    this.perfilService.actualizarFoto(foto).subscribe({
      next: ({ foto_url }) => {
        if (this.perfil) this.perfil = { ...this.perfil, foto_url };
        this.fotoVersion = Date.now();
        this.fotoSubiendo = false;
        this.exito = this.i18n.t('perfil.fotoActualizada');
        input.value = '';
      },
      error: (error) => {
        this.fotoSubiendo = false;
        this.error = this.i18n.errorApi(error.error?.error, 'perfil.errorFoto');
        input.value = '';
      }
    });
  }

  private extraerFormulario(perfil: Perfil): PerfilEditable {
    this.zonaAnterior = esBarrioDeLaLista(perfil.zona) ? null : perfil.zona;
    return {
      presupuesto: perfil.presupuesto,
      zona: perfil.zona,
      horario: perfil.horario,
      limpieza: perfil.limpieza,
      tolerancia_ruido: perfil.tolerancia_ruido,
      frecuencia_visitas: perfil.frecuencia_visitas,
      tiene_mascotas: perfil.tiene_mascotas,
      acepta_mascotas: perfil.acepta_mascotas,
      descripcion: perfil.descripcion || ''
    };
  }
}
