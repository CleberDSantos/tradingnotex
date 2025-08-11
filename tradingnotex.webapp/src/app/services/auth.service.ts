import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';
import { AuthStateService } from './auth-state.service';

export interface LoginRequest { username?: string; password?: string; }
export interface RegisterRequest { username?: string; password?: string; email?: string; }

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private base = environment.apiBaseUrl.replace(/\/+$/, '') + '/api/Auth';

  constructor(
    private http: HttpClient,
    private authStateService: AuthStateService
  ) {}

  login(payload: LoginRequest): Observable<any> {
    return this.http.post(`${this.base}/login`, payload).pipe(
      tap((response: any) => {
        // Assumindo que a resposta contenha um token
        const token = response.token || response.sessionToken || null;
        this.authStateService.setAuthenticated(true, token);
      })
    );
  }

  register(payload: RegisterRequest): Observable<any> {
    return this.http.post(`${this.base}/register`, payload);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.base}/logout`, {}).pipe(
      tap(() => {
        this.authStateService.setAuthenticated(false);
      })
    );
  }
}
