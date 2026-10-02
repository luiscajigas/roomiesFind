import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Perfil } from '../models/perfil.model';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  miPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.apiUrl}/perfiles/me`);
  }

  candidatos(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(`${this.apiUrl}/perfiles/candidatos`);
  }

  urlFoto(fotoUrl: string | null | undefined): string | null {
    if (!fotoUrl) return null;
    if (/^https?:\/\//i.test(fotoUrl)) return fotoUrl;
    if (!/^\/uploads\/[A-Za-z0-9._-]+$/.test(fotoUrl)) return null;
    return `${this.apiUrl.replace(/\/api\/?$/, '')}${fotoUrl}`;
  }
}
