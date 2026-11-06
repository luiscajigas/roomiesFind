import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { TarjetaCompaneroComponent } from '../../components/tarjeta-companero/tarjeta-companero.component';
import { comunaDeBarrio } from '../../data/barrios-pasto';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { ClaveTexto } from '../../i18n/textos';
import { Perfil, ResultadoCompatibilidad } from '../../models/perfil.model';
import { CompatibilidadService } from '../../services/compatibilidad.service';
import { PerfilService } from '../../services/perfil.service';

type Orden = 'compatibilidad' | 'presupuesto' | 'nombre';

@Component({
  selector: 'app-companeros',
  standalone: true,
  imports: [CommonModule, FormsModule, AppHeaderComponent, TarjetaCompaneroComponent, TraducirPipe],
  templateUrl: './companeros.component.html'
})
export class CompanerosComponent implements OnInit, OnDestroy {
  resultados: ResultadoCompatibilidad[] = [];
  miPerfil: Perfil | null = null;
  cargando = true;
  error: ClaveTexto | null = null;
  comuna = '';
  orden: Orden = 'compatibilidad';
  private worker: Worker | null = null;

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
      next: (miPerfil) => {
        this.miPerfil = miPerfil;
        this.cargarCandidatos(miPerfil);
      },
      error: () => {
        this.error = 'companeros.errorPerfil';
        this.cargando = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
  }

  /** Solo se ofrecen las comunas donde hay alguien buscando. */
  get comunasDisponibles(): string[] {
    const comunas = new Set(this.resultados.map((r) => comunaDeBarrio(r.candidato.zona)));
    return [...comunas]
      .filter((comuna): comuna is string => comuna !== null)
      .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }

  get visibles(): ResultadoCompatibilidad[] {
    const filtrados = this.comuna
      ? this.resultados.filter((r) => comunaDeBarrio(r.candidato.zona) === this.comuna)
      : this.resultados;

    if (this.orden === 'nombre') {
      return [...filtrados].sort((a, b) => a.candidato.nombre.localeCompare(b.candidato.nombre, 'es'));
    }
    if (this.orden === 'presupuesto') {
      const mio = this.miPerfil?.presupuesto ?? 0;
      return [...filtrados].sort((a, b) =>
        Math.abs(a.candidato.presupuesto - mio) - Math.abs(b.candidato.presupuesto - mio));
    }
    return filtrados;
  }

  private cargarCandidatos(miPerfil: Perfil): void {
    this.perfiles.candidatos().subscribe({
      next: (candidatos) => {
        if (this.worker) {
          this.worker.postMessage({ yo: miPerfil, candidatos });
        } else {
          this.error = 'companeros.errorNavegador';
          this.cargando = false;
        }
      },
      error: () => {
        this.error = 'companeros.errorLista';
        this.cargando = false;
      }
    });
  }
}
