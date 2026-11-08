import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Solo deja pasar a administradores. El servidor vuelve a comprobarlo en cada petición. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaAutenticado) return router.createUrlTree(['/login']);
  return auth.actualizarSesion().pipe(
    map((usuario) => usuario.rol === 'admin' || router.createUrlTree(['/dashboard'])),
    catchError(() => of(router.createUrlTree(['/dashboard'])))
  );
};
