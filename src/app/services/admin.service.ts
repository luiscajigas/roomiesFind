import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CuentaReportada, Ficha, ReporteAdmin, ResumenAdmin, Suspension } from '../api/tipos';

export type FichaPersona = Ficha;
export type CuentaSuspendida = Suspension;
export type { CuentaReportada, ReporteAdmin, ResumenAdmin };

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
