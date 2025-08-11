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
    const token = localStorage.getItem('authToken');
    if (token) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  setAuthenticated(isAuthenticated: boolean, token?: string) {
    this.isAuthenticatedSubject.next(isAuthenticated);

    if (isAuthenticated && token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
