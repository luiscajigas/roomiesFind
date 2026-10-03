import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { Perfil, ResultadoCompatibilidad } from '../../models/perfil.model';
import { CompatibilidadService } from '../../services/compatibilidad.service';
import { PerfilService } from '../../services/perfil.service';

@Component({
  selector: 'app-companeros',
  standalone: true,
  imports: [CommonModule, RouterLink, AppHeaderComponent],
  templateUrl: './companeros.component.html'
})
export class CompanerosComponent implements OnInit, OnDestroy {
  resultados: ResultadoCompatibilidad[] = [];
  cargando = true;
  error: string | null = null;
  private worker: Worker | null = null;
  private versionFoto = Date.now();

  constructor(
    private perfiles: PerfilService,
    private compatibilidad: CompatibilidadService
  ) {}

  ngOnInit(): void {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('../../workers/compatibilidad.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        this.resultados = data as ResultadoCompatibilidad[];
        this.cargando = false;
        for (const resultado of this.resultados) {
          this.compatibilidad.registrar(resultado.candidato.id, resultado.score).subscribe({
            error: (error) => console.error('No se pudo guardar la recomendación:', error)
          });
        }
      };
    }

    this.perfiles.miPerfil().subscribe({
      next: (miPerfil) => this.cargarCandidatos(miPerfil),
      error: () => {
        this.error = 'No se pudo cargar tu perfil. Intenta volver a iniciar sesión.';
        this.cargando = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
  }

  iniciales(nombre: string): string {
    return nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map((parte) => parte.charAt(0)).join('').toUpperCase() || '?';
  }

  urlFoto(perfil: Perfil): string | null {
    return this.perfiles.urlFoto(perfil.foto_url, this.versionFoto);
  }

  ocultarImagen(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }

  private cargarCandidatos(miPerfil: Perfil): void {
    this.perfiles.candidatos().subscribe({
      next: (candidatos) => {
        if (this.worker) {
          this.worker.postMessage({ yo: miPerfil, candidatos });
        } else {
          this.error = 'Tu navegador no permite iniciar el cálculo de compatibilidad.';
          this.cargando = false;
        }
      },
      error: () => {
        this.error = 'No se pudieron cargar los compañeros. Inténtalo de nuevo.';
        this.cargando = false;
      }
    });
  }
}
