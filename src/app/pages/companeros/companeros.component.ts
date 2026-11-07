import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, forkJoin, from, of, switchMap } from 'rxjs';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { TarjetaCompaneroComponent } from '../../components/tarjeta-companero/tarjeta-companero.component';
import { COMUNAS_PASTO } from '../../data/barrios-pasto';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { ClaveTexto } from '../../i18n/textos';
import { Perfil, ResultadoCompatibilidad } from '../../models/perfil.model';
import { CompatibilidadService } from '../../services/compatibilidad.service';
import { IdiomaService } from '../../services/idioma.service';
import { FiltroMascotas, FiltrosBusqueda, OrdenBusqueda, PerfilService } from '../../services/perfil.service';
import { MotorCompatibilidad } from '../../utils/motor-compatibilidad';

const POR_PAGINA = 12;

@Component({
  selector: 'app-companeros',
  standalone: true,
  imports: [CommonModule, FormsModule, AppHeaderComponent, TarjetaCompaneroComponent, TraducirPipe],
  templateUrl: './companeros.component.html'
})
export class CompanerosComponent implements OnInit, OnDestroy {
  readonly comunas = COMUNAS_PASTO.map((comuna) => comuna.nombre);

  resultados: ResultadoCompatibilidad[] = [];
  total = 0;
  miPerfil: Perfil | null = null;
  cargando = true;
  cargandoMas = false;
  error: ClaveTexto | null = null;
  errorMas = false;

  comuna = '';
  horario = '';
  presupuestoMaximo: number | null = null;
  mascotas: FiltroMascotas | '' = '';
  puntajeMinimo: number | null = null;
  orden: OrdenBusqueda = 'compatibilidad';

  private pagina = 1;
  /** Al quitar a alguien, los siguientes se corren hacia atrás y uno quedaría sin mostrarse. */
  private huboBajas = false;
  private readonly motor = new MotorCompatibilidad();
  private readonly busquedas = new Subject<void>();
  private readonly suscripciones = new Subscription();
  private pedidoMas?: Subscription;

  constructor(
    private perfiles: PerfilService,
    private compatibilidad: CompatibilidadService,
    readonly i18n: IdiomaService
  ) {}

  ngOnInit(): void {
    // switchMap descarta la respuesta anterior si los filtros cambian mientras llega.
    this.suscripciones.add(this.busquedas.pipe(
      switchMap(() => this.perfiles.buscar(this.filtros(1)).pipe(
        switchMap((pagina) => forkJoin({ total: of(pagina.total), resultados: from(this.calcular(pagina.candidatos)) }))
      ))
    ).subscribe({
      next: ({ total, resultados }) => {
        this.resultados = resultados;
        this.total = total;
        this.pagina = 1;
        this.huboBajas = false;
        this.cargando = false;
        this.registrar(resultados);
      },
      error: () => {
        this.error = 'companeros.errorLista';
        this.cargando = false;
      }
    }));

    this.perfiles.miPerfil().subscribe({
      next: (miPerfil) => {
        this.miPerfil = miPerfil;
        this.buscar();
      },
      error: () => {
        this.error = 'companeros.errorPerfil';
        this.cargando = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
    this.pedidoMas?.unsubscribe();
    this.motor.terminar();
  }

  get hayMas(): boolean {
    return this.resultados.length < this.total;
  }

  get hayFiltros(): boolean {
    return !!(this.comuna || this.horario || this.mascotas || this.presupuestoMaximo !== null || this.puntajeMinimo !== null);
  }

  seguir(_indice: number, resultado: ResultadoCompatibilidad): number {
    return resultado.candidato.id;
  }

  buscar(): void {
    this.pedidoMas?.unsubscribe();
    this.cargandoMas = false;
    this.errorMas = false;
    this.error = null;
    this.cargando = true;
    this.busquedas.next();
  }

  quitarFiltros(): void {
    this.comuna = '';
    this.horario = '';
    this.presupuestoMaximo = null;
    this.mascotas = '';
    this.puntajeMinimo = null;
    this.buscar();
  }

  verMas(): void {
    if (this.cargandoMas || !this.hayMas) return;
    this.cargandoMas = true;
    this.errorMas = false;
    const siguiente = this.pagina + 1;
    const paginas = this.huboBajas ? [this.pagina, siguiente] : [siguiente];

    this.pedidoMas = forkJoin(paginas.map((numero) => this.perfiles.buscar(this.filtros(numero)))).pipe(
      switchMap((respuestas) => {
        // Alguien puede haber cambiado de página si se registró gente mientras tanto.
        const vistos = new Set(this.resultados.map((resultado) => resultado.candidato.id));
        const nuevos = respuestas
          .flatMap((respuesta) => respuesta.candidatos)
          .filter((candidato) => !vistos.has(candidato.id) && vistos.add(candidato.id));
        return forkJoin({ total: of(respuestas[respuestas.length - 1].total), nuevos: from(this.calcular(nuevos)) });
      })
    ).subscribe({
      next: ({ total, nuevos }) => {
        this.resultados = [...this.resultados, ...nuevos];
        this.total = total;
        this.pagina = siguiente;
        this.huboBajas = false;
        this.cargandoMas = false;
        this.registrar(nuevos);
      },
      error: () => {
        this.cargandoMas = false;
        this.errorMas = true;
      }
    });
  }

  alBloquear(id: number): void {
    this.resultados = this.resultados.filter((resultado) => resultado.candidato.id !== id);
    this.total = Math.max(0, this.total - 1);
    this.huboBajas = true;
  }

  private filtros(pagina: number): FiltrosBusqueda {
    return {
      pagina,
      tamano: POR_PAGINA,
      orden: this.orden,
      zonas: COMUNAS_PASTO.find((comuna) => comuna.nombre === this.comuna)?.barrios,
      horario: this.horario,
      presupuestoMaximo: this.presupuestoMaximo,
      mascotas: this.mascotas,
      puntajeMinimo: this.puntajeMinimo
    };
  }

  private calcular(candidatos: Perfil[]): Promise<ResultadoCompatibilidad[]> {
    return this.motor.calcular(this.miPerfil as Perfil, candidatos);
  }

  private registrar(resultados: ResultadoCompatibilidad[]): void {
    for (const resultado of resultados) {
      this.compatibilidad.registrar(resultado.candidato.id, resultado.score).subscribe({
        error: (error) => console.error('No se pudo guardar la recomendación:', error)
      });
    }
  }
}
