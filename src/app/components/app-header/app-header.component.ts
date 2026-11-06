import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarComponent } from '../avatar/avatar.component';
import { SelectorIdiomaComponent } from '../selector-idioma/selector-idioma.component';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { PerfilService } from '../../services/perfil.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AvatarComponent, SelectorIdiomaComponent, TraducirPipe],
  templateUrl: './app-header.component.html'
})
export class AppHeaderComponent implements OnInit {
  menuAbierto = false;

  @ViewChild('menuContainer') private menuContainer?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;

  constructor(
    private auth: AuthService,
    private perfil: PerfilService,
    private router: Router,
    private theme: ThemeService,
    private chat: ChatService
  ) {}

  /** La conexión queda abierta en toda la app para avisar de mensajes nuevos. */
  ngOnInit(): void {
    if (this.auth.estaAutenticado) this.chat.conectar();
  }

  get noLeidos$() {
    return this.chat.noLeidos$;
  }

  get foto$() {
    return this.perfil.fotoActual$;
  }

  get usuario() {
    return this.auth.usuarioActual;
  }

  get modoClaro(): boolean {
    return this.theme.modoClaro;
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
    this.chat.desconectar();
    this.auth.logout();
    this.perfil.limpiarFotoActual();
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
