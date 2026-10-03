import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app-header.component.html'
})
export class AppHeaderComponent {
  menuAbierto = false;

  @ViewChild('menuContainer') private menuContainer?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;

  constructor(
    private auth: AuthService,
    private router: Router,
    private theme: ThemeService
  ) {}

  get usuario() {
    return this.auth.usuarioActual;
  }

  get modoClaro(): boolean {
    return this.theme.modoClaro;
  }

  iniciales(nombre: string): string {
    return nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map((parte) => parte.charAt(0)).join('').toUpperCase() || '?';
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  alternarTema(): void {
    this.theme.alternar();
  }

  salir(): void {
    this.cerrarMenu();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  cerrarMenuAlHacerClickFuera(event: MouseEvent): void {
    if (this.menuAbierto && !this.menuContainer?.nativeElement.contains(event.target as Node)) {
      this.cerrarMenu();
    }
  }

  @HostListener('document:keydown.escape')
  cerrarMenuConEscape(): void {
    if (this.menuAbierto) {
      this.cerrarMenu();
      this.menuToggle?.nativeElement.focus();
    }
  }
}
