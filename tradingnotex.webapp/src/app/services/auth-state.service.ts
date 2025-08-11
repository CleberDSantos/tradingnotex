import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Verificar se o usuário está autenticado ao inicializar o serviço
    const token = this.getStoredToken();
    if (token) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  setAuthenticated(isAuthenticated: boolean, token?: string) {
    this.isAuthenticatedSubject.next(isAuthenticated);

    if (isAuthenticated && token) {
      this.storeToken(token);
    } else {
      this.removeToken();
    }
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  private storeToken(token: string): void {
    try {
      localStorage.setItem('authToken', token);
    } catch (error) {
      console.warn('Could not store token in localStorage:', error);
      // Fallback para sessionStorage se localStorage não estiver disponível
      try {
        sessionStorage.setItem('authToken', token);
      } catch (sessionError) {
        console.warn('Could not store token in sessionStorage:', sessionError);
      }
    }
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    } catch (error) {
      console.warn('Could not retrieve token from storage:', error);
      return null;
    }
  }

  private removeToken(): void {
    try {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    } catch (error) {
      console.warn('Could not remove token from storage:', error);
    }
  }
}
