import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Solo deja pasar a usuarios con sesión iniciada. */
export const authGuard: CanActivateFn = () =>
  inject(AuthService).user() ? true : inject(Router).createUrlTree(['/login']);

/** Si ya inició sesión, no lo deja volver al login/registro. */
export const invitadoGuard: CanActivateFn = () =>
  inject(AuthService).user() ? inject(Router).createUrlTree(['/home']) : true;
