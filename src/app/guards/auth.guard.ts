import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('user_token');

  if (token) {
    return true; // Usuario autenticado, se le permite el paso
  }

  // Si no hay token, lo mandamos al login
  router.navigate(['/login']);
  return false;
};