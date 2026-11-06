import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'roomiesfind_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private currentTheme: Theme = this.loadTheme();

  constructor() {
    this.applyTheme();
  }

  get modoClaro(): boolean {
    return this.currentTheme === 'light';
  }

  alternar(): void {
    this.currentTheme = this.modoClaro ? 'dark' : 'light';
    this.applyTheme();

    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, this.currentTheme);
    } catch {
      // El tema permanece activo en esta página aunque el navegador bloquee el almacenamiento.
    }
  }

  private loadTheme(): Theme {
    try {
      return this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY) === 'light'
        ? 'light'
        : 'dark';
    } catch {
      return 'dark';
    }
  }

  private applyTheme(): void {
    this.document.documentElement.setAttribute('data-theme', this.currentTheme);
  }
}
