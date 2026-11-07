import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { ClaveTexto } from '../../i18n/textos';
import { IdiomaService } from '../../services/idioma.service';
import { MOTIVOS_REPORTE, ModeracionService, MotivoReporte } from '../../services/moderacion.service';

const TEXTO_MOTIVO: Record<MotivoReporte, ClaveTexto> = {
  acoso: 'moderar.motivoAcoso',
  perfil_falso: 'moderar.motivoFalso',
  estafa: 'moderar.motivoEstafa',
  contenido_inapropiado: 'moderar.motivoContenido',
  otro: 'moderar.motivoOtro'
};

/** Botones para reportar y bloquear a una persona, con sus ventanas de confirmación. */
@Component({
  selector: 'app-moderar-persona',
  standalone: true,
  imports: [CommonModule, FormsModule, TraducirPipe],
  templateUrl: './moderar-persona.component.html'
})
export class ModerarPersonaComponent {
  @Input({ required: true }) personaId!: number;
  @Input({ required: true }) nombre!: string;
  @Output() bloqueada = new EventEmitter<number>();

  readonly motivos = MOTIVOS_REPORTE;
  ventana: 'reporte' | 'bloqueo' | 'gracias' | null = null;
  motivo: MotivoReporte | null = null;
  detalle = '';
  tambienBloquear = false;
  enviando = false;
  error: string | null = null;
  private bloqueoPendiente = false;

  @ViewChild('dialogo') private set dialogo(referencia: ElementRef<HTMLDialogElement> | undefined) {
    this.elemento = referencia?.nativeElement;
    if (this.elemento && !this.elemento.open) this.elemento.showModal();
  }
  private elemento?: HTMLDialogElement;

  constructor(private moderacion: ModeracionService, private i18n: IdiomaService) {}

  get faltaDetalle(): boolean {
    return this.motivo === 'otro' && !this.detalle.trim();
  }

  textoMotivo(motivo: MotivoReporte): ClaveTexto {
    return TEXTO_MOTIVO[motivo];
  }

  abrir(ventana: 'reporte' | 'bloqueo'): void {
    this.motivo = null;
    this.detalle = '';
    this.tambienBloquear = false;
    this.error = null;
    this.ventana = ventana;
  }

  cerrar(): void {
    this.elemento?.close();
  }

  /** También llega al cerrar con Escape. */
  alCerrar(): void {
    this.ventana = null;
    if (this.bloqueoPendiente) {
      this.bloqueoPendiente = false;
      this.bloqueada.emit(this.personaId);
    }
  }

  /** Un clic en el propio <dialog> es un clic en el fondo. */
  alHacerClic(evento: MouseEvent): void {
    if (evento.target === this.elemento && !this.enviando) this.cerrar();
  }

  bloquear(): void {
    this.enviando = true;
    this.error = null;
    this.moderacion.bloquear(this.personaId).subscribe({
      next: () => {
        this.enviando = false;
        this.bloqueoPendiente = true;
        this.cerrar();
      },
      error: (error) => this.alFallar(error, 'moderar.errorBloqueo')
    });
  }

  reportar(): void {
    if (!this.motivo || this.faltaDetalle) return;
    this.enviando = true;
    this.error = null;
    this.moderacion.reportar(this.personaId, this.motivo, this.detalle, this.tambienBloquear).subscribe({
      next: () => {
        this.enviando = false;
        this.bloqueoPendiente = this.tambienBloquear;
        this.ventana = 'gracias';
      },
      error: (error) => this.alFallar(error, 'moderar.errorReporte')
    });
  }

  private alFallar(error: { error?: { error?: string } }, alternativa: ClaveTexto): void {
    this.enviando = false;
    this.error = this.i18n.errorApi(error.error?.error, alternativa);
  }
}
