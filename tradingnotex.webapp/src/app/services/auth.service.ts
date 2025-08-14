import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';
import { AuthStateService } from './auth-state.service';

export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface RegisterRequest {
  username?: string;
  password?: string;
  email?: string;
}

export interface LoginResponse {
  objectId: string;
  sessionToken: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private base = environment.apiBaseUrl.replace(/\/+$/, '') + '/api/Auth';

  constructor(
    private http: HttpClient,
    private authStateService: AuthStateService
  ) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, payload).pipe(
      tap((response: LoginResponse) => {
        if (response && response.sessionToken) {
          this.authStateService.setAuthenticated(true, response.sessionToken);
          localStorage.setItem('userId', response.objectId);
          localStorage.setItem('username', response.username);
        }
      })
    );
  }

  register(payload: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/register`, payload);
  }

  logout(): Observable<any> {
    const token = this.authStateService.getToken();
    return this.http.post(`${this.base}/logout`, {}, {
      headers: {
        'X-Parse-Session-Token': token || ''
      }
    }).pipe(
      tap(() => {
        this.authStateService.setAuthenticated(false);
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
      })
    );
  }
}
