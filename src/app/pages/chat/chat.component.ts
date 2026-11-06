import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { Perfil } from '../../models/perfil.model';
import { AuthService } from '../../services/auth.service';
import { ChatService, ConversacionChat, EventoChat, MensajeChat } from '../../services/chat.service';
import { IdiomaService } from '../../services/idioma.service';
import { PerfilService } from '../../services/perfil.service';

/** Un mensaje en pantalla; mientras no tiene id definitivo sigue "enviando". */
interface MensajeVista extends MensajeChat {
  idCliente?: string;
  enviando?: boolean;
}

interface FilaConversacion {
  otroId: number;
  nombre: string;
  foto: string | null;
  ultimo: MensajeChat | null;
  noLeidos: number;
}

const AVISO_ESCRIBIENDO_MS = 3000;
const VISIBLE_ESCRIBIENDO_MS = 4000;
const LARGO_MAXIMO = 2000;
const CERCA_DEL_FINAL_PX = 120;

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppHeaderComponent, AvatarComponent, TraducirPipe],
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  private lista?: ElementRef<HTMLElement>;
  /** La lista cambia de alto con la ventana, el teclado del celular o el aviso de reconexión. */
  private readonly observadorLista = new ResizeObserver(() => {
    const lista = this.lista?.nativeElement;
    if (lista && this.pegadoAlFinal) lista.scrollTop = lista.scrollHeight;
  });

  @ViewChild('lista')
  private set referenciaLista(referencia: ElementRef<HTMLElement> | undefined) {
    if (referencia?.nativeElement === this.lista?.nativeElement) return;
    this.observadorLista.disconnect();
    if (referencia) this.observadorLista.observe(referencia.nativeElement);
    this.lista = referencia;
  }

  @ViewChild('campo') private campo?: ElementRef<HTMLTextAreaElement>;

  readonly largoMaximo = LARGO_MAXIMO;
  personas = new Map<number, Perfil>();
  conversaciones: ConversacionChat[] = [];
  mensajes: MensajeVista[] = [];
  otroId: number | null = null;
  texto = '';
  busqueda = '';
  cargando = true;
  cargandoMensajes = false;
  cargandoAnteriores = false;
  hayMas = false;
  otroEscribiendo = false;
  errorEnvio: string | null = null;
  errorCarga = false;

  private suscripciones = new Subscription();
  private ultimoAvisoEscribiendo = 0;
  private temporizadorEscribiendo: ReturnType<typeof setTimeout> | null = null;
  private bajarAlFinal = false;
  /** Si la persona está viendo lo último, la conversación se mantiene abajo. */
  private pegadoAlFinal = true;
  private alturaAntesDeCargar: number | null = null;
  private contadorCliente = 0;

  constructor(
    readonly chat: ChatService,
    readonly i18n: IdiomaService,
    private auth: AuthService,
    private perfiles: PerfilService,
    private ruta: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chat.conectar();
    this.perfiles.candidatos().subscribe({
      next: (lista) => {
        this.personas = new Map(lista.map((persona) => [persona.id, persona]));
        this.cargando = false;
      },
      error: () => {
        this.errorCarga = true;
        this.cargando = false;
      }
    });
    this.cargarConversaciones();

    this.suscripciones.add(this.ruta.queryParamMap.subscribe((parametros) => {
      const id = Number(parametros.get('con'));
      this.abrir(Number.isSafeInteger(id) && id > 0 ? id : null);
    }));
    this.suscripciones.add(this.chat.eventos$.subscribe((evento) => this.alRecibirEvento(evento)));
    // Al reconectar se recupera lo que llegó mientras no había conexión.
    this.suscripciones.add(this.chat.estado$.subscribe((estado) => {
      if (estado !== 'conectado') return;
      this.cargarConversaciones();
      if (this.otroId) this.cargarMensajes(this.otroId);
    }));
  }

  ngAfterViewChecked(): void {
    const lista = this.lista?.nativeElement;
    if (!lista) return;
    if (this.alturaAntesDeCargar !== null) {
      lista.scrollTop = lista.scrollHeight - this.alturaAntesDeCargar;
      this.alturaAntesDeCargar = null;
    } else if (this.bajarAlFinal) {
      lista.scrollTop = lista.scrollHeight;
      this.bajarAlFinal = false;
      this.pegadoAlFinal = true;
    }
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
    this.observadorLista.disconnect();
    if (this.temporizadorEscribiendo) clearTimeout(this.temporizadorEscribiendo);
  }

  /** Al volver a la pestaña, se marca como leído lo que llegó mientras no se veía. */
  @HostListener('document:visibilitychange')
  alCambiarVisibilidad(): void {
    if (!document.hidden) this.marcarLeidoSiCorresponde();
  }

  alDesplazar(): void {
    this.pegadoAlFinal = this.estaCercaDelFinal();
  }

  get miId(): number {
    return this.auth.usuarioActual?.id ?? 0;
  }

  get otraPersona(): Perfil | null {
    return this.otroId ? this.personas.get(this.otroId) ?? null : null;
  }

  get fotoOtra(): string | null {
    return this.perfiles.urlFoto(this.otraPersona?.foto_url);
  }

  get conectado(): boolean {
    return this.chat.estado$.value === 'conectado';
  }

  get localeFechas(): string {
    return this.i18n.idioma === 'en' ? 'en-US' : 'es-CO';
  }

  /** Primero las conversaciones con mensajes y luego el resto de personas, para poder empezar una nueva. */
  get filas(): FilaConversacion[] {
    const consulta = this.busqueda.trim().toLowerCase();
    const conMensajes = this.conversaciones
      .filter((conversacion) => this.personas.has(conversacion.otroId))
      .map((conversacion) => this.fila(conversacion.otroId, conversacion.ultimoMensaje, conversacion.noLeidos));
    const conMensajesIds = new Set(conMensajes.map((fila) => fila.otroId));
    const sinMensajes = [...this.personas.keys()]
      .filter((id) => !conMensajesIds.has(id))
      .map((id) => this.fila(id, null, 0))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return [...conMensajes, ...sinMensajes].filter((fila) => !consulta || fila.nombre.toLowerCase().includes(consulta));
  }

  esDiaNuevo(indice: number): boolean {
    if (indice === 0) return true;
    return new Date(this.mensajes[indice - 1].creadoEn).toDateString() !== new Date(this.mensajes[indice].creadoEn).toDateString();
  }

  etiquetaDia(fecha: string): string | null {
    const dia = new Date(fecha).toDateString();
    const hoy = new Date();
    if (dia === hoy.toDateString()) return this.i18n.t('chat.hoy');
    hoy.setDate(hoy.getDate() - 1);
    return dia === hoy.toDateString() ? this.i18n.t('chat.ayer') : null;
  }

  esHoy(fecha: string): boolean {
    return new Date(fecha).toDateString() === new Date().toDateString();
  }

  /** Mensajes seguidos de la misma persona van más juntos. */
  continuaGrupo(indice: number): boolean {
    return indice > 0 && !this.esDiaNuevo(indice) && this.mensajes[indice - 1].remitenteId === this.mensajes[indice].remitenteId;
  }

  seguir(_indice: number, mensaje: MensajeVista): string | number {
    return mensaje.idCliente ?? mensaje.id;
  }

  alEscribir(): void {
    this.errorEnvio = null;
    this.ajustarAltura();
    const ahora = Date.now();
    if (this.otroId && this.texto.trim() && ahora - this.ultimoAvisoEscribiendo > AVISO_ESCRIBIENDO_MS) {
      this.ultimoAvisoEscribiendo = ahora;
      this.chat.avisarEscribiendo(this.otroId);
    }
  }

  alPresionarTecla(evento: KeyboardEvent): void {
    // Enter envía; Shift + Enter hace un salto de línea. Mientras se compone un acento, Enter no envía.
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.isComposing) {
      evento.preventDefault();
      this.enviar();
    }
  }

  enviar(): void {
    const contenido = this.texto.trim();
    if (!contenido || !this.otroId) return;

    const idCliente = `c${Date.now()}-${++this.contadorCliente}`;
    if (!this.chat.enviar(this.otroId, contenido, idCliente)) {
      this.errorEnvio = this.i18n.t('chat.sinConexion');
      return;
    }
    this.mensajes = [...this.mensajes, {
      id: 0, idCliente, enviando: true, remitenteId: this.miId, destinatarioId: this.otroId,
      contenido, creadoEn: new Date().toISOString(), leidoEn: null
    }];
    this.texto = '';
    this.errorEnvio = null;
    this.ultimoAvisoEscribiendo = 0;
    this.pegadoAlFinal = true;
    this.bajarAlFinal = true;
    setTimeout(() => {
      this.ajustarAltura();
      this.campo?.nativeElement.focus();
    });
  }

  cargarAnteriores(): void {
    const primero = this.mensajes.find((mensaje) => mensaje.id > 0);
    if (!this.otroId || !primero || this.cargandoAnteriores) return;
    const otroId = this.otroId;
    this.cargandoAnteriores = true;
    this.chat.mensajes(otroId, primero.id).subscribe({
      next: ({ mensajes, hayMas }) => {
        this.cargandoAnteriores = false;
        if (this.otroId !== otroId) return;
        this.alturaAntesDeCargar = this.lista?.nativeElement.scrollHeight ?? null;
        this.mensajes = [...mensajes, ...this.mensajes];
        this.hayMas = hayMas;
      },
      error: () => (this.cargandoAnteriores = false)
    });
  }

  volverALista(): void {
    this.router.navigate(['/chat']);
  }

  private abrir(id: number | null): void {
    if (id === this.otroId) return;
    this.otroId = id;
    this.mensajes = [];
    this.hayMas = false;
    this.texto = '';
    this.errorEnvio = null;
    this.otroEscribiendo = false;
    this.pegadoAlFinal = true;
    if (id) this.cargarMensajes(id);
  }

  private cargarMensajes(otroId: number): void {
    this.cargandoMensajes = true;
    this.chat.mensajes(otroId).subscribe({
      next: ({ mensajes, hayMas }) => {
        this.cargandoMensajes = false;
        if (this.otroId !== otroId) return;
        // Conserva lo que todavía se está enviando.
        const pendientes = this.mensajes.filter((mensaje) => mensaje.enviando);
        this.mensajes = [...mensajes, ...pendientes];
        this.hayMas = hayMas;
        this.bajarAlFinal = true;
        this.marcarLeidoSiCorresponde();
        setTimeout(() => this.campo?.nativeElement.focus());
      },
      error: () => {
        this.cargandoMensajes = false;
        this.errorCarga = true;
      }
    });
  }

  private cargarConversaciones(): void {
    this.chat.conversaciones().subscribe({
      next: (lista) => (this.conversaciones = lista),
      error: () => {}
    });
  }

  private alRecibirEvento(evento: EventoChat): void {
    switch (evento.tipo) {
      case 'mensaje':
        this.alRecibirMensaje(evento.mensaje);
        break;
      case 'enviado':
        this.confirmarEnvio(evento.idCliente, evento.mensaje);
        break;
      case 'error':
        this.alFallarEnvio(evento.idCliente, evento.mensaje);
        break;
      case 'leidos':
        if (evento.lectorId === this.otroId) {
          this.mensajes = this.mensajes.map((mensaje) =>
            mensaje.remitenteId === this.miId && !mensaje.leidoEn ? { ...mensaje, leidoEn: evento.leidoEn } : mensaje);
        }
        this.cargarConversaciones();
        break;
      case 'escribiendo':
        if (evento.usuarioId === this.otroId) this.mostrarEscribiendo();
        break;
    }
  }

  private alRecibirMensaje(mensaje: MensajeChat): void {
    const otro = mensaje.remitenteId === this.miId ? mensaje.destinatarioId : mensaje.remitenteId;
    if (otro === this.otroId && !this.mensajes.some((m) => m.id === mensaje.id)) {
      // Si es mío y aún espera confirmación en esta pestaña, lo resuelve "enviado".
      const esPendienteMio = mensaje.remitenteId === this.miId
        && this.mensajes.some((m) => m.enviando && m.contenido === mensaje.contenido);
      if (!esPendienteMio) {
        this.mensajes = [...this.mensajes, mensaje];
        if (this.pegadoAlFinal || mensaje.remitenteId === this.miId) this.bajarAlFinal = true;
      }
      if (mensaje.remitenteId !== this.miId) {
        this.otroEscribiendo = false;
        this.marcarLeidoSiCorresponde();
      }
    }
    this.cargarConversaciones();
  }

  private confirmarEnvio(idCliente: string, mensaje: MensajeChat): void {
    const yaEstaba = this.mensajes.some((m) => m.id === mensaje.id);
    this.mensajes = this.mensajes
      .filter((m) => !(yaEstaba && m.idCliente === idCliente))
      .map((m) => (m.idCliente === idCliente ? { ...mensaje, idCliente } : m));
    this.cargarConversaciones();
  }

  /** Devuelve el texto al campo para que la persona no lo pierda. */
  private alFallarEnvio(idCliente: string | null, mensaje: string): void {
    const fallido = this.mensajes.find((m) => m.idCliente === idCliente);
    if (fallido) {
      this.mensajes = this.mensajes.filter((m) => m !== fallido);
      if (!this.texto) this.texto = fallido.contenido;
    }
    this.errorEnvio = this.i18n.errorApi(mensaje, 'chat.errorEnvio');
  }

  private mostrarEscribiendo(): void {
    this.otroEscribiendo = true;
    if (this.pegadoAlFinal) this.bajarAlFinal = true;
    if (this.temporizadorEscribiendo) clearTimeout(this.temporizadorEscribiendo);
    this.temporizadorEscribiendo = setTimeout(() => (this.otroEscribiendo = false), VISIBLE_ESCRIBIENDO_MS);
  }

  private marcarLeidoSiCorresponde(): void {
    if (!this.otroId || document.hidden) return;
    const haySinLeer = this.mensajes.some((m) => m.remitenteId === this.otroId && !m.leidoEn);
    if (haySinLeer) this.chat.marcarLeidos(this.otroId);
  }

  private estaCercaDelFinal(): boolean {
    const lista = this.lista?.nativeElement;
    return !lista || lista.scrollHeight - lista.scrollTop - lista.clientHeight < CERCA_DEL_FINAL_PX;
  }

  private ajustarAltura(): void {
    const campo = this.campo?.nativeElement;
    if (!campo) return;
    campo.style.height = 'auto';
    campo.style.height = `${campo.scrollHeight}px`;
  }

  private fila(otroId: number, ultimo: MensajeChat | null, noLeidos: number): FilaConversacion {
    const persona = this.personas.get(otroId);
    return {
      otroId,
      nombre: persona?.nombre ?? '',
      foto: this.perfiles.urlFoto(persona?.foto_url),
      ultimo,
      noLeidos: otroId === this.otroId ? 0 : noLeidos
    };
  }
}
