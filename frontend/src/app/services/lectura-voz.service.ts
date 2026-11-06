import { Injectable, NgZone } from '@angular/core';
import { IdiomaService } from './idioma.service';

/**
 * Lee textos en voz alta con la voz del navegador (Web Speech API).
 * Se envía frase por frase porque algunos navegadores cortan los textos largos.
 * Solo suena una lectura a la vez: empezar otra avisa a la anterior que terminó.
 */
@Injectable({ providedIn: 'root' })
export class LecturaVozService {
  private alTerminarActual: (() => void) | null = null;

  constructor(private zona: NgZone, private i18n: IdiomaService) {}

  get disponible(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  leer(texto: string, alTerminar: () => void): void {
    if (!this.disponible) return;
    this.detener();
    this.alTerminarActual = alTerminar;

    const voz = this.vozDelIdioma();
    const frases = texto.split(/(?<=[.!?…])\s+/).filter(Boolean);
    const terminar = () => {
      if (this.alTerminarActual === alTerminar) this.finalizar();
    };

    frases.forEach((frase, indice) => {
      const locucion = new SpeechSynthesisUtterance(frase);
      locucion.lang = voz?.lang ?? (this.i18n.idioma === 'en' ? 'en-US' : 'es-CO');
      if (voz) locucion.voice = voz;
      locucion.onerror = terminar;
      if (indice === frases.length - 1) locucion.onend = terminar;
      window.speechSynthesis.speak(locucion);
    });
  }

  detener(): void {
    if (!this.disponible) return;
    window.speechSynthesis.cancel();
    this.finalizar();
  }

  private finalizar(): void {
    const alTerminar = this.alTerminarActual;
    this.alTerminarActual = null;
    if (alTerminar) this.zona.run(alTerminar);
  }

  private vozDelIdioma(): SpeechSynthesisVoice | undefined {
    const voces = window.speechSynthesis.getVoices();
    const preferida = this.i18n.idioma === 'en' ? 'en-US' : 'es-CO';
    return voces.find((voz) => voz.lang === preferida)
      ?? voces.find((voz) => voz.lang.toLowerCase().startsWith(this.i18n.idioma));
  }
}
