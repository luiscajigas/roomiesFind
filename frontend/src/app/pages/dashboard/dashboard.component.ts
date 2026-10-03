import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { CompatibilidadService, RespuestaExplicacion } from '../../services/compatibilidad.service';
import { ThemeService } from '../../services/theme.service';
import { Perfil, ResultadoCompatibilidad } from '../../models/perfil.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  menuAbierto = false;
  fotoSubiendo = false;
  errorFoto: string | null = null;
  private versionFoto = Date.now();

  private worker: Worker | null = null;

  @ViewChild('menuContainer') private menuContainer?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;

  constructor(
    private perfilService: PerfilService,
    private compatibilidadService: CompatibilidadService,
    private auth: AuthService,
    private router: Router,
    private theme: ThemeService
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

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  alternarTema(): void {
    this.theme.alternar();
  }

  get modoClaro(): boolean {
    return this.theme.modoClaro;
  }

  @HostListener('document:click', ['$event'])
  cerrarMenuAlHacerClickFuera(event: MouseEvent): void {
    if (this.menuAbierto && !this.menuContainer?.nativeElement.contains(event.target as Node)) {
      this.cerrarMenu();
    }
  }

  @HostListener('document:keydown.escape')
  cerrarMenuConEscape(): void {
    if (this.menuAbierto) {
      this.cerrarMenu();
      this.menuToggle?.nativeElement.focus();
    }
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

  iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join('')
      .toUpperCase() || '?';
  }

  ocultarImagen(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
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
      this.errorFoto = 'Elige una imagen JPG, PNG, WEBP o GIF.';
      input.value = '';
      return;
    }
    if (foto.size > 5 * 1024 * 1024) {
      this.errorFoto = 'La foto debe pesar 5 MB o menos.';
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
        this.errorFoto = error.error?.error || 'No se pudo guardar la foto. Inténtalo de nuevo.';
        this.fotoSubiendo = false;
        input.value = '';
      }
    });
  }
}
