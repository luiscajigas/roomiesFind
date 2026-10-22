import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  cargando = false;
  servidorLento = false;
  error: string | null = null;
  private temporizadorLento: ReturnType<typeof setTimeout> | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  ingresar(): void {
    this.cargando = true;
    this.error = null;
    this.servidorLento = false;
    // El plan gratuito de Render duerme el servicio: la primera petición puede tardar ~1 minuto.
    this.temporizadorLento = setTimeout(() => {
      if (this.cargando) this.servidorLento = true;
    }, 8000);
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.limpiarTemporizador();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        this.limpiarTemporizador();
        this.error = err.error?.error || 'No se pudo iniciar sesión.';
      }
    });
  }

  private limpiarTemporizador(): void {
    if (this.temporizadorLento) {
      clearTimeout(this.temporizadorLento);
      this.temporizadorLento = null;
    }
    this.servidorLento = false;
  }

}
