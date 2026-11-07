import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { Perfil } from '../../models/perfil.model';
import { ModeracionService } from '../../services/moderacion.service';
import { PerfilService } from '../../services/perfil.service';
import { AvatarComponent } from '../avatar/avatar.component';

/** Lista de las personas que el usuario bloqueó, para poder desbloquearlas. */
@Component({
  selector: 'app-personas-bloqueadas',
  standalone: true,
  imports: [CommonModule, AvatarComponent, TraducirPipe],
  template: `
    <section class="grupo bloqueados">
      <h2>{{ 'bloqueados.titulo' | t }}</h2>
      <p class="aviso aviso--error" *ngIf="error" role="alert">{{ 'bloqueados.error' | t }}</p>
      <p class="bloqueados__vacio" *ngIf="!cargando && !personas.length && !error">{{ 'bloqueados.vacio' | t }}</p>
      <ul *ngIf="personas.length">
        <li *ngFor="let persona of personas">
          <app-avatar [nombre]="persona.nombre" [foto]="foto(persona)"></app-avatar>
          <span>{{ persona.nombre }}</span>
          <button class="btn btn--secundario" type="button" [disabled]="quitando === persona.id" (click)="desbloquear(persona)">{{ 'bloqueados.desbloquear' | t }}</button>
        </li>
      </ul>
    </section>
  `
})
export class PersonasBloqueadasComponent implements OnInit {
  personas: Perfil[] = [];
  cargando = true;
  error = false;
  quitando: number | null = null;

  constructor(private moderacion: ModeracionService, private perfiles: PerfilService) {}

  ngOnInit(): void {
    this.moderacion.bloqueados().subscribe({
      next: (personas) => {
        this.personas = personas;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  foto(persona: Perfil): string | null {
    return this.perfiles.urlFoto(persona.foto_url);
  }

  desbloquear(persona: Perfil): void {
    this.quitando = persona.id;
    this.error = false;
    this.moderacion.desbloquear(persona.id).subscribe({
      next: () => {
        this.personas = this.personas.filter((otra) => otra.id !== persona.id);
        this.quitando = null;
      },
      error: () => {
        this.quitando = null;
        this.error = true;
      }
    });
  }
}
