import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStateService } from './services/auth-state.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authStateService = inject(AuthStateService);
  const router = inject(Router);

  if (authStateService.isAuthenticated()) {
    return true;
  } else {
    // Redirecionar para a página de login se não estiver autenticado
    return router.parseUrl('/login');
  }
};
