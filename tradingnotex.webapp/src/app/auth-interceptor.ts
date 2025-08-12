import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from './services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStateService = inject(AuthStateService);
  const token = authStateService.getToken();

  if (req.url.includes('/Auth/login') || req.url.includes('/Auth/register')) {
    return next(req);
  }

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        'X-Parse-Session-Token': token
      }
    });
    
    console.log('Token sendo enviado:', token);
    console.log('URL da requisição:', req.url);
    
    return next(authReq);
  }

  return next(req);
};
