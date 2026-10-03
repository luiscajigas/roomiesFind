import { Component, OnDestroy } from '@angular/core';
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
export class RegistroComponent implements OnDestroy {
  readonly maximoFotoBytes = 5 * 1024 * 1024;
  readonly tiposFotoPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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

  fotoSeleccionada: File | null = null;
  vistaPreviaFoto: string | null = null;
  cargando = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnDestroy(): void {
    this.limpiarFoto();
  }

  seleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    if (!this.tiposFotoPermitidos.includes(archivo.type)) {
      input.value = '';
      this.error = 'No se pudo agregar la foto. Elige una imagen JPG, PNG, WEBP o GIF.';
      return;
    }
    if (archivo.size > this.maximoFotoBytes) {
      input.value = '';
      this.error = 'No se pudo agregar la foto. El archivo debe pesar 5 MB o menos.';
      return;
    }

    this.limpiarFoto();
    this.fotoSeleccionada = archivo;
    this.vistaPreviaFoto = URL.createObjectURL(archivo);
    this.error = null;
  }

  quitarFoto(input: HTMLInputElement): void {
    this.limpiarFoto();
    input.value = '';
  }

  private limpiarFoto(): void {
    if (this.vistaPreviaFoto) {
      URL.revokeObjectURL(this.vistaPreviaFoto);
    }
    this.vistaPreviaFoto = null;
    this.fotoSeleccionada = null;
  }

  registrar(): void {
    this.cargando = true;
    this.error = null;
    this.auth.registro(this.datos, this.fotoSeleccionada ?? undefined).subscribe({
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
