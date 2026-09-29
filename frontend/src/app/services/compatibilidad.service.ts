import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RespuestaExplicacion {
  id: number;
  estado: 'pendiente' | 'generado';
  explicacion: string;
  score: number;
  coincidencias: string[];
  conflictos: string[];
}

@Injectable({ providedIn: 'root' })
export class CompatibilidadService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  registrar(candidatoId: number, score: number): Observable<{ registrado: boolean }> {
    return this.http.post<{ registrado: boolean }>(`${this.apiUrl}/compatibilidad/registrar`, {
      candidatoId,
      score
    });
  }

  explicar(
    candidatoId: number,
    score: number,
    coincidencias: string[],
    conflictos: string[]
  ): Observable<RespuestaExplicacion> {
    return this.http.post<RespuestaExplicacion>(`${this.apiUrl}/ia/explicar`, {
      candidatoId,
      score,
      coincidencias,
      conflictos
    });
  }
}
