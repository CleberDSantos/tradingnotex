import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from './services/auth-state.service';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStateService);
  const token = auth.getToken();
  const apiBase = (environment.apiBaseUrl || '').replace(/\/+$/, '');

  const isApi = apiBase && req.url.startsWith(apiBase);
  const isAuthEndpoint = req.url.includes('/Auth/login') || req.url.includes('/Auth/register');

  if (!isApi || isAuthEndpoint || !token) return next(req);

  return next(req.clone({ setHeaders: { 'X-Parse-Session-Token': token } }));
};
