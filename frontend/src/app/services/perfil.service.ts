import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Perfil } from '../models/perfil.model';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly apiUrl = environment.apiUrl;
  private readonly fotoActual = new BehaviorSubject<string | null>(null);
  private versionFoto = Date.now();

  /** Foto del usuario con sesión, para mostrarla en el encabezado. */
  readonly fotoActual$ = this.fotoActual.asObservable();

  constructor(private http: HttpClient) {}

  miPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.apiUrl}/perfiles/me`).pipe(
      tap((perfil) => this.fotoActual.next(this.urlFoto(perfil.foto_url, this.versionFoto)))
    );
  }

  actualizar(datos: Partial<Perfil>): Observable<Perfil> {
    return this.http.put<Perfil>(`${this.apiUrl}/perfiles/me`, datos);
  }

  candidatos(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(`${this.apiUrl}/perfiles/candidatos`);
  }

  actualizarFoto(foto: File): Observable<{ foto_url: string }> {
    const formulario = new FormData();
    formulario.append('foto', foto);
    return this.http.put<{ foto_url: string }>(`${this.apiUrl}/perfiles/me/foto`, formulario).pipe(
      tap(({ foto_url }) => {
        this.versionFoto = Date.now();
        this.fotoActual.next(this.urlFoto(foto_url, this.versionFoto));
      })
    );
  }

  limpiarFotoActual(): void {
    this.fotoActual.next(null);
  }

  urlFoto(fotoUrl: string | null | undefined, version?: number): string | null {
    if (!fotoUrl) return null;
    if (/^https?:\/\//i.test(fotoUrl)) return fotoUrl;
    if (!/^\/(?:uploads\/[A-Za-z0-9._-]+|api\/perfiles\/[0-9]+\/foto)$/.test(fotoUrl)) return null;
    const url = `${this.apiUrl.replace(/\/api\/?$/, '')}${fotoUrl}`;
    return fotoUrl.startsWith('/api/') && version ? `${url}?v=${version}` : url;
  }
}
