import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MotivoReporte } from './moderacion.service';

export interface FichaPersona {
  id: number;
  nombre: string;
  email: string;
  rol: 'usuario' | 'admin';
  foto_url: string | null;
}

export interface ReporteAdmin {
  id: number;
  motivo: MotivoReporte;
  detalle: string | null;
  estado: 'pendiente' | 'revisado' | 'descartado';
  creadoEn: string;
  reportante: { id: number; nombre: string } | null;
}

export interface CuentaReportada {
  persona: FichaPersona;
  alerta: boolean;
  suspendida: boolean;
  reportes: ReporteAdmin[];
}

export interface CuentaSuspendida {
  persona: FichaPersona;
  motivo: string;
  creadaEn: string;
  suspendidaPor: { id: number; nombre: string } | null;
}

export interface ResumenAdmin {
  cuentasPorRevisar: number;
  reportesPendientes: number;
  alertasActivas: number;
  cuentasSuspendidas: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  resumen(): Observable<ResumenAdmin> {
    return this.http.get<ResumenAdmin>(`${this.apiUrl}/resumen`);
  }

  reportes(estado: 'pendientes' | 'todos'): Observable<CuentaReportada[]> {
    return this.http.get<CuentaReportada[]>(`${this.apiUrl}/reportes`, { params: { estado } });
  }

  suspendidas(): Observable<CuentaSuspendida[]> {
    return this.http.get<CuentaSuspendida[]>(`${this.apiUrl}/suspendidas`);
  }

  descartar(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cuentas/${id}/descartar`, null);
  }

  mantener(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cuentas/${id}/mantener`, null);
  }

  suspender(id: number, motivo: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cuentas/${id}/suspension`, { motivo });
  }

  reactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cuentas/${id}/suspension`);
  }
}
