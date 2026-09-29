import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
  presupuesto: number;
  zona: string;
  horario: string;
  limpieza: number;
  tolerancia_ruido: number;
  frecuencia_visitas: string;
  tiene_mascotas: boolean;
  acepta_mascotas: boolean;
  descripcion?: string;
}

interface RespuestaAuth {
  token: string;
  usuario: { id: number; nombre: string; email: string };
}

const CLAVE_TOKEN = 'roomies_token';
const CLAVE_USUARIO = 'roomies_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  registro(datos: DatosRegistro): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/auth/registro`, datos)
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  login(email: string, password: string): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  }

  private guardarSesion(r: RespuestaAuth): void {
    localStorage.setItem(CLAVE_TOKEN, r.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(r.usuario));
  }

  get token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  get estaAutenticado(): boolean {
    return !!this.token;
  }

  get usuarioActual(): { id: number; nombre: string; email: string } | null {
    const raw = localStorage.getItem(CLAVE_USUARIO);
    return raw ? JSON.parse(raw) : null;
  }
}
