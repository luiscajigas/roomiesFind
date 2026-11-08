import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ComparadorComponent, HabitosComparables } from '../../components/comparador/comparador.component';
import { SelectorIdiomaComponent } from '../../components/selector-idioma/selector-idioma.component';
import { TraducirPipe } from '../../i18n/traducir.pipe';
import { AuthService } from '../../services/auth.service';
import { CLAVE_AVISO_SUSPENSION, CUENTA_SUSPENDIDA } from '../../services/auth.interceptor';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ComparadorComponent, SelectorIdiomaComponent, TraducirPipe],
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

  readonly ejemploYo: HabitosComparables = { nombre: 'Tú', presupuesto: 650000, limpieza: 4, tolerancia_ruido: 2 };
  readonly ejemploOtro: HabitosComparables = { nombre: 'Ana', presupuesto: 600000, limpieza: 4, tolerancia_ruido: 3 };

  /** Cuentas públicas para quien revisa el proyecto. Se muestran en la pantalla de ingreso. */
  readonly cuentasDemo = {
    usuario: { email: 'test@gmail.com', password: '123456' },
    admin: { email: 'admin@gmail.com', password: '123456' }
  };
  tipoDemo: 'usuario' | 'admin' = 'usuario';

  get cuentaDemo(): { email: string; password: string } {
    return this.cuentasDemo[this.tipoDemo];
  }

  constructor(private auth: AuthService, private router: Router, private i18n: IdiomaService) {
    try {
      if (sessionStorage.getItem(CLAVE_AVISO_SUSPENSION)) {
        sessionStorage.removeItem(CLAVE_AVISO_SUSPENSION);
        this.error = this.i18n.errorApi(CUENTA_SUSPENDIDA, 'login.error');
      }
    } catch {
      // Sin almacenamiento no hay aviso que mostrar.
    }
  }

  usarCuentaDemo(): void {
    this.email = this.cuentaDemo.email;
    this.password = this.cuentaDemo.password;
    this.error = null;
  }

  ingresar(): void {
    this.cargando = true;
    this.error = null;
    this.servidorLento = false;
    // Si el servidor tarda en responder, se avisa para que la persona no crea que falló.
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
        this.error = this.i18n.errorApi(err.error?.error, 'login.error');
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
