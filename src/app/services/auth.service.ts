import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sesion, UsuarioSesion } from '../api/tipos';

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

export type { UsuarioSesion };
type RespuestaAuth = Sesion;

const CLAVE_TOKEN = 'roomies_token';
const CLAVE_USUARIO = 'roomies_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  registro(datos: DatosRegistro, foto?: File): Observable<RespuestaAuth> {
    const formulario = new FormData();
    for (const [campo, valor] of Object.entries(datos)) {
      formulario.append(campo, String(valor));
    }
    if (foto) {
      formulario.append('foto', foto);
    }

    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/auth/registro`, formulario)
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  login(email: string, password: string): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  /** Trae los datos actuales de la sesión: el rol puede haber cambiado desde que se inició. */
  actualizarSesion(): Observable<UsuarioSesion> {
    return this.http.get<UsuarioSesion>(`${this.apiUrl}/auth/sesion`).pipe(
      tap((usuario) => localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario)))
    );
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

  get esAdmin(): boolean {
    return this.usuarioActual?.rol === 'admin';
  }

  get usuarioActual(): UsuarioSesion | null {
    const raw = localStorage.getItem(CLAVE_USUARIO);
    return raw ? JSON.parse(raw) : null;
  }
}
