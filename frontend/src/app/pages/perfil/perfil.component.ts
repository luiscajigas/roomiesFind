import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { Perfil } from '../../models/perfil.model';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';

type PerfilEditable = Pick<Perfil,
  'presupuesto' | 'zona' | 'horario' | 'limpieza' | 'tolerancia_ruido' |
  'frecuencia_visitas' | 'tiene_mascotas' | 'acepta_mascotas' | 'descripcion'>;

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppHeaderComponent],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {
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
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.perfilService.miPerfil().subscribe({
      next: (perfil) => {
        this.perfil = perfil;
        this.formulario = this.extraerFormulario(perfil);
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar tu perfil. Intenta volver a iniciar sesión.';
        this.cargando = false;
      }
    });
  }

  get nombre(): string {
    return this.auth.usuarioActual?.nombre || this.perfil?.nombre || 'Mi perfil';
  }

  get fotoSrc(): string | null {
    return this.perfilService.urlFoto(this.perfil?.foto_url, this.fotoVersion);
  }

  get iniciales(): string {
    return this.nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map((parte) => parte.charAt(0)).join('').toUpperCase() || '?';
  }

  ocultarImagen(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
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
        this.exito = 'Tu perfil se guardó correctamente.';
      },
      error: (error) => {
        this.guardando = false;
        this.error = error.error?.error || 'No se pudo guardar tu perfil. Inténtalo de nuevo.';
      }
    });
  }

  actualizarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const foto = input.files?.[0];
    if (!foto) return;

    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!permitidos.includes(foto.type)) {
      this.error = 'Elige una imagen JPG, PNG, WEBP o GIF.';
      input.value = '';
      return;
    }
    if (foto.size > 5 * 1024 * 1024) {
      this.error = 'La foto debe pesar 5 MB o menos.';
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
        this.exito = 'Tu foto de perfil se actualizó.';
        input.value = '';
      },
      error: (error) => {
        this.fotoSubiendo = false;
        this.error = error.error?.error || 'No se pudo actualizar tu foto.';
        input.value = '';
      }
    });
  }

  private extraerFormulario(perfil: Perfil): PerfilEditable {
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
