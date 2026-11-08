import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const CUENTA_SUSPENDIDA = 'Tu cuenta fue suspendida.';
export const CLAVE_AVISO_SUSPENSION = 'roomies_suspendida';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si suspenden la cuenta con la sesión abierta, se cierra y se explica en el inicio de sesión.
      if (token && error.status === 403 && error.error?.error === CUENTA_SUSPENDIDA) {
        auth.logout();
        try {
          sessionStorage.setItem(CLAVE_AVISO_SUSPENSION, '1');
        } catch {
          // Sin almacenamiento, el inicio de sesión no muestra el aviso; no es grave.
        }
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
