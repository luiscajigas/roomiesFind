import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ClaveTexto } from '../i18n/textos';
import { MotivoReporte, ReporteCreado } from '../api/tipos';
import { Perfil } from '../models/perfil.model';

export type { MotivoReporte };

/** En el orden en que se muestran. `satisfies` avisa si el contrato agrega o quita un motivo. */
export const MOTIVOS_REPORTE = ['acoso', 'perfil_falso', 'estafa', 'contenido_inapropiado', 'otro'] as const satisfies readonly MotivoReporte[];

export const TEXTO_MOTIVO: Record<MotivoReporte, ClaveTexto> = {
  acoso: 'moderar.motivoAcoso',
  perfil_falso: 'moderar.motivoFalso',
  estafa: 'moderar.motivoEstafa',
  contenido_inapropiado: 'moderar.motivoContenido',
  otro: 'moderar.motivoOtro'
};

@Injectable({ providedIn: 'root' })
export class ModeracionService {
  private readonly apiUrl = `${environment.apiUrl}/moderacion`;

  constructor(private http: HttpClient) {}

  bloqueados(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(`${this.apiUrl}/bloqueos`);
  }

  bloquear(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bloqueos/${id}`, null);
  }

  desbloquear(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bloqueos/${id}`);
  }

  reportar(reportadoId: number, motivo: MotivoReporte, detalle: string, bloquear: boolean): Observable<ReporteCreado> {
    return this.http.post<ReporteCreado>(`${this.apiUrl}/reportes`, { reportadoId, motivo, detalle, bloquear });
  }
}
