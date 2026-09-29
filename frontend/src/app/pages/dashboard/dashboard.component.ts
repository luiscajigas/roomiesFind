import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { CompatibilidadService, RespuestaExplicacion } from '../../services/compatibilidad.service';
import { Perfil, ResultadoCompatibilidad } from '../../models/perfil.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  miPerfil: Perfil | null = null;
  resultados: ResultadoCompatibilidad[] = [];
  cargando = true;
  error: string | null = null;

  explicacionAbierta: number | null = null; // id del candidato con la explicación abierta
  explicaciones: Record<number, RespuestaExplicacion> = {};
  cargandoExplicacion: number | null = null;

  private worker: Worker | null = null;

  constructor(
    private perfilService: PerfilService,
    private compatibilidadService: CompatibilidadService,
    private auth: AuthService,
    private router: Router
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
        this.error = 'No se pudo cargar tu perfil o la lista de candidatos.';
        this.cargando = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
  }

  verExplicacion(resultado: ResultadoCompatibilidad): void {
    const id = resultado.candidato.id;

    if (this.explicacionAbierta === id) {
      this.explicacionAbierta = null;
      return;
    }

    this.explicacionAbierta = id;

    if (this.explicaciones[id]) return; // ya la pedimos antes, no repetir llamada

    this.cargandoExplicacion = id;
    this.compatibilidadService
      .explicar(id, resultado.score, resultado.coincidencias, resultado.conflictos)
      .subscribe({
        next: (respuesta) => {
          this.explicaciones[id] = respuesta;
          this.cargandoExplicacion = null;
        },
        error: () => {
          this.cargandoExplicacion = null;
        }
      });
  }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  get usuario() {
    return this.auth.usuarioActual;
  }
}
