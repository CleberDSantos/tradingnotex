import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from './services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStateService = inject(AuthStateService);
  const token = authStateService.getToken();

  if (token) {
    // Clonar a requisição e adicionar o cabeçalho de autorização
    const authReq = req.clone({
      headers: req.headers.set('X-Parse-Session-Token', token)
    });
    return next(authReq);
  }

  return next(req);
};
