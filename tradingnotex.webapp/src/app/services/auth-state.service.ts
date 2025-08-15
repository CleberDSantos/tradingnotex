import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const TOKEN_KEY = 'authToken';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    if (this.getStoredToken()) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  /** Mais robusto para guards síncronos */
  hasToken(): boolean {
    return !!this.getStoredToken();
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  /** Use isto no login/logout */
  setAuthenticated(isAuthenticated: boolean, token?: string) {
    this.isAuthenticatedSubject.next(isAuthenticated);

    if (isAuthenticated) {
      if (token) this.storeToken(token); // mantém o token atual se não vier um novo
      return;
    }

    // só remove quando setar explicitamente para false
    this.removeToken();
  }
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // ----- storage helpers -----
  private storeToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      try {
        sessionStorage.setItem(TOKEN_KEY, token);
      } catch {}
    }
  }

  private getStoredToken(): string | null {
    try {
      return (
        localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
      );
    } catch {
      return null;
    }
  }

  private removeToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
}
