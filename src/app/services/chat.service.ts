import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Perfil } from '../models/perfil.model';
import { AuthService } from './auth.service';

export interface MensajeChat {
  id: number;
  remitenteId: number;
  destinatarioId: number;
  contenido: string;
  creadoEn: string;
  leidoEn: string | null;
}

export interface ConversacionChat {
  otroId: number;
  persona: Perfil;
  ultimoMensaje: MensajeChat;
  noLeidos: number;
}

export type EventoChat =
  | { tipo: 'mensaje'; mensaje: MensajeChat }
  | { tipo: 'enviado'; idCliente: string; mensaje: MensajeChat }
  | { tipo: 'error'; idCliente: string | null; mensaje: string }
  | { tipo: 'leidos'; lectorId: number; remitenteId: number; leidoEn: string }
  | { tipo: 'escribiendo'; usuarioId: number }
  | { tipo: 'alerta'; usuarioId: number }
  | { tipo: 'bloqueo'; usuarioId: number };

export type EstadoConexion = 'desconectado' | 'conectando' | 'conectado';

const PING_MS = 30_000;
const ESPERA_RECONEXION_MAXIMA_MS = 20_000;

/**
 * Conexión en tiempo real del chat. Se mantiene abierta mientras haya sesión,
 * para que el aviso de mensajes nuevos funcione en toda la app. Si se corta,
 * reconecta sola esperando cada vez un poco más.
 */
@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly apiUrl = environment.apiUrl;
  private socket: WebSocket | null = null;
  private quiereConexion = false;
  private intentos = 0;
  private temporizadorReconexion: ReturnType<typeof setTimeout> | null = null;
  private temporizadorPing: ReturnType<typeof setInterval> | null = null;

  readonly estado$ = new BehaviorSubject<EstadoConexion>('desconectado');
  readonly eventos$ = new Subject<EventoChat>();
  readonly noLeidos$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnDestroy(): void {
    this.desconectar();
  }

  conectar(): void {
    this.quiereConexion = true;
    if (!this.socket) this.abrir();
  }

  desconectar(): void {
    this.quiereConexion = false;
    this.limpiarTemporizadores();
    this.socket?.close();
    this.socket = null;
    this.estado$.next('desconectado');
    this.noLeidos$.next(0);
  }

  conversaciones(): Observable<ConversacionChat[]> {
    return this.http.get<ConversacionChat[]>(`${this.apiUrl}/chat/conversaciones`);
  }

  mensajes(otroId: number, antesDe?: number): Observable<{ mensajes: MensajeChat[]; hayMas: boolean }> {
    const params = antesDe ? new HttpParams().set('antesDe', antesDe) : undefined;
    return this.http.get<{ mensajes: MensajeChat[]; hayMas: boolean }>(
      `${this.apiUrl}/chat/conversaciones/${otroId}/mensajes`, { params });
  }

  /** @returns false si no hay conexión y el mensaje no salió */
  enviar(destinatarioId: number, contenido: string, idCliente: string): boolean {
    return this.transmitir({ tipo: 'enviar', destinatarioId, contenido, idCliente });
  }

  marcarLeidos(otroId: number): void {
    this.transmitir({ tipo: 'leer', otroId });
  }

  avisarEscribiendo(destinatarioId: number): void {
    this.transmitir({ tipo: 'escribiendo', destinatarioId });
  }

  refrescarNoLeidos(): void {
    if (!this.auth.estaAutenticado) return;
    this.conversaciones().subscribe({
      next: (lista) => this.noLeidos$.next(lista.reduce((total, c) => total + c.noLeidos, 0)),
      error: () => {}
    });
  }

  private abrir(): void {
    const token = this.auth.token;
    if (!token) return;

    this.estado$.next('conectando');
    const socket = new WebSocket(this.urlWebSocket());
    this.socket = socket;

    // El token va como primer mensaje y no en la URL, para que no quede en registros.
    socket.onopen = () => socket.send(JSON.stringify({ tipo: 'autenticar', token }));
    socket.onmessage = (evento) => this.alRecibir(JSON.parse(evento.data));
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.limpiarTemporizadores();
      this.estado$.next('desconectado');
      if (this.quiereConexion) this.programarReconexion();
    };
  }

  private alRecibir(datos: { tipo: string } & Record<string, unknown>): void {
    switch (datos.tipo) {
      case 'listo':
        this.intentos = 0;
        this.estado$.next('conectado');
        this.temporizadorPing = setInterval(() => this.transmitir({ tipo: 'ping' }), PING_MS);
        this.refrescarNoLeidos();
        break;
      case 'pong':
        break;
      default: {
        const evento = datos as unknown as EventoChat;
        this.eventos$.next(evento);
        if (evento.tipo === 'mensaje' || evento.tipo === 'leidos' || evento.tipo === 'bloqueo') this.refrescarNoLeidos();
      }
    }
  }

  private programarReconexion(): void {
    const espera = Math.min(1000 * 2 ** this.intentos, ESPERA_RECONEXION_MAXIMA_MS);
    this.intentos++;
    this.temporizadorReconexion = setTimeout(() => this.abrir(), espera);
  }

  private transmitir(datos: Record<string, unknown>): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN || this.estado$.value !== 'conectado') return false;
    this.socket.send(JSON.stringify(datos));
    return true;
  }

  private urlWebSocket(): string {
    return `${this.apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '')}/ws/chat`;
  }

  private limpiarTemporizadores(): void {
    if (this.temporizadorReconexion) clearTimeout(this.temporizadorReconexion);
    if (this.temporizadorPing) clearInterval(this.temporizadorPing);
    this.temporizadorReconexion = null;
    this.temporizadorPing = null;
  }
}
