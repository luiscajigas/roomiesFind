import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Explicacion, Idioma, Registrado, Traduccion } from '../api/tipos';

export type RespuestaExplicacion = Explicacion;

@Injectable({ providedIn: 'root' })
export class CompatibilidadService {
  private readonly apiUrl = environment.apiUrl;
  private readonly traducciones = new Map<string, Observable<string | null>>();

  constructor(private http: HttpClient) {}

  registrar(candidatoId: number, score: number): Observable<Registrado> {
    return this.http.post<Registrado>(`${this.apiUrl}/compatibilidad/registrar`, {
      candidatoId,
      score
    });
  }

  /** Traducción de la descripción de un perfil, o null si no se pudo traducir. */
  traducirDescripcion(usuarioId: number, texto: string, idioma: Idioma): Observable<string | null> {
    const clave = `${usuarioId}|${idioma}|${texto}`;
    const guardada = this.traducciones.get(clave);
    if (guardada) return guardada;

    const peticion = this.http
      .post<Traduccion>(`${this.apiUrl}/ia/traducir-descripcion`, { usuarioId, idioma })
      .pipe(
        map((respuesta) => respuesta.descripcion),
        catchError(() => {
          // No se guarda el fallo: la próxima vez se vuelve a intentar.
          this.traducciones.delete(clave);
          return of(null);
        }),
        shareReplay(1)
      );
    this.traducciones.set(clave, peticion);
    return peticion;
  }

  explicar(
    candidatoId: number,
    score: number,
    coincidencias: string[],
    conflictos: string[],
    idioma: Idioma
  ): Observable<RespuestaExplicacion> {
    return this.http.post<RespuestaExplicacion>(`${this.apiUrl}/ia/explicar`, {
      candidatoId,
      score,
      coincidencias,
      conflictos,
      idioma
    });
  }
}
