import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStateService } from './services/auth-state.service';

const PUBLIC_PATHS = new Set<string>([
  '/', '/home', '/login', '/register', '/link-expired', '/invalid-link'
]);

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  // ✅ Se for rota pública, sempre permite
  const url = state.url?.split('?')[0] || '/';
  if (PUBLIC_PATHS.has(url)) return true;

  // ✅ Demais rotas: requer token
  const token = auth.getToken();
  if (token) {
    if (!auth.isAuthenticated()) auth.setAuthenticated(true, token);
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
