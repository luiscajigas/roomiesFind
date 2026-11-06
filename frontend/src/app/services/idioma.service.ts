import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OTRO_BARRIO } from '../data/barrios-pasto';
import { ClaveTexto, ERRORES_API, RAZONES, TEXTOS } from '../i18n/textos';

export type Idioma = 'es' | 'en';

const CLAVE_ALMACENAMIENTO = 'roomiesfind_idioma';

/** Idioma de la interfaz. Se recuerda entre visitas. */
@Injectable({ providedIn: 'root' })
export class IdiomaService {
  private readonly document = inject(DOCUMENT);
  private readonly actual = new BehaviorSubject<Idioma>(this.cargar());

  /** Avisa cada vez que cambia el idioma. */
  readonly cambios$ = this.actual.asObservable();

  constructor() {
    this.document.documentElement.lang = this.idioma;
  }

  get idioma(): Idioma {
    return this.actual.value;
  }

  cambiar(idioma: Idioma): void {
    if (idioma === this.idioma) return;
    this.actual.next(idioma);
    this.document.documentElement.lang = idioma;
    try {
      this.document.defaultView?.localStorage.setItem(CLAVE_ALMACENAMIENTO, idioma);
    } catch {
      // El idioma sigue activo en esta página aunque el navegador bloquee el almacenamiento.
    }
  }

  t(clave: ClaveTexto, parametros?: Record<string, string | number>): string {
    let texto: string = TEXTOS[clave][this.idioma];
    for (const [nombre, valor] of Object.entries(parametros ?? {})) {
      texto = texto.replace(`{${nombre}}`, String(valor));
    }
    return texto;
  }

  /** La API responde en español; aquí se traduce lo que ve el usuario. */
  errorApi(mensaje: string | null | undefined, alternativa: ClaveTexto): string {
    if (!mensaje) return this.t(alternativa);
    return this.idioma === 'en' ? (ERRORES_API[mensaje] ?? this.t(alternativa)) : mensaje;
  }

  /** Traduce una razón calculada por el Web Worker. */
  razon(texto: string): string {
    if (this.idioma === 'es') return texto;
    const ambos = /^Ambos buscan en (.+)$/.exec(texto);
    if (ambos) return `Both are looking in ${this.zona(ambos[1])}`;
    const distintas = /^Zonas distintas \((.+) vs (.+)\)$/.exec(texto);
    if (distintas) return `Different areas (${this.zona(distintas[1])} vs ${this.zona(distintas[2])})`;
    return RAZONES[texto] ?? texto;
  }

  /** Los barrios son nombres propios; solo se traduce la opción "Otro barrio". */
  zona(zona: string | null | undefined): string {
    if (!zona) return '';
    return zona === OTRO_BARRIO ? this.t('zona.otra') : zona;
  }

  horario(valor: string | null | undefined): string {
    const clave = `horario.${valor}` as ClaveTexto;
    return clave in TEXTOS ? this.t(clave) : (valor ?? '');
  }

  visitas(valor: string | null | undefined): string {
    const clave = `visitas.${valor}` as ClaveTexto;
    return clave in TEXTOS ? this.t(clave) : (valor ?? '');
  }

  private cargar(): Idioma {
    try {
      return this.document.defaultView?.localStorage.getItem(CLAVE_ALMACENAMIENTO) === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  }
}
