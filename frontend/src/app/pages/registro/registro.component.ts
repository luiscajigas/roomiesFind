import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, DatosRegistro } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  datos: DatosRegistro = {
    nombre: '',
    email: '',
    password: '',
    presupuesto: 500000,
    zona: '',
    horario: 'mixto',
    limpieza: 3,
    tolerancia_ruido: 3,
    frecuencia_visitas: 'ocasional',
    tiene_mascotas: false,
    acepta_mascotas: true,
    descripcion: ''
  };

  cargando = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  registrar(): void {
    this.cargando = true;
    this.error = null;
    this.auth.registro(this.datos).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.error || 'No se pudo completar el registro.';
      }
    });
  }
}
