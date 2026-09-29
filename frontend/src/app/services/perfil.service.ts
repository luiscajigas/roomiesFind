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
}
