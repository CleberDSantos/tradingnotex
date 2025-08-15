import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStateService } from './services/auth-state.service';

export const authCanMatch: CanMatchFn = (route, segments: UrlSegment[]) => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  const token = auth.getToken();
  if (token) {
    if (!auth.isAuthenticated()) auth.setAuthenticated(true, token);
    return true;
  }

  // não permite que o bloco protegido seja escolhido
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: '/' + segments.map(s => s.path).join('/') }
  });
};
