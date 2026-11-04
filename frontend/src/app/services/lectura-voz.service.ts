import { Injectable, NgZone } from '@angular/core';

/**
 * Lee textos en voz alta con la voz del navegador (Web Speech API).
 * Se envía frase por frase porque algunos navegadores cortan los textos largos.
 */
@Injectable({ providedIn: 'root' })
export class LecturaVozService {
  private lecturaActual = 0;

  constructor(private zona: NgZone) {}

  get disponible(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  leer(texto: string, alTerminar: () => void): void {
    if (!this.disponible) return;
    this.detener();
    const lectura = this.lecturaActual;
    const voz = this.vozEnEspanol();
    const frases = texto.split(/(?<=[.!?…])\s+/).filter(Boolean);

    const terminar = () => {
      if (lectura === this.lecturaActual) this.zona.run(alTerminar);
    };

    frases.forEach((frase, indice) => {
      const locucion = new SpeechSynthesisUtterance(frase);
      locucion.lang = voz?.lang ?? 'es-CO';
      if (voz) locucion.voice = voz;
      locucion.onerror = terminar;
      if (indice === frases.length - 1) locucion.onend = terminar;
      window.speechSynthesis.speak(locucion);
    });
  }

  detener(): void {
    if (!this.disponible) return;
    this.lecturaActual++;
    window.speechSynthesis.cancel();
  }

  private vozEnEspanol(): SpeechSynthesisVoice | undefined {
    const voces = window.speechSynthesis.getVoices();
    return voces.find((voz) => voz.lang === 'es-CO')
      ?? voces.find((voz) => voz.lang.toLowerCase().startsWith('es'));
  }
}
