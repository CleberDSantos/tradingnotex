import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Account {
  objectId?: string;
  name: string;
  broker?: string;
  accountType?: 'demo' | 'real' | 'prop';
  currency?: string;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private base = environment.apiBaseUrl.replace(/\/+$/, '') + '/api/classes/Account';
  private cachedAccounts: Account[] = [];

  constructor(private http: HttpClient) {
    this.loadAccounts();
  }

  list(): Observable<{ results: Account[] }> {
    return this.http.get<{ results: Account[] }>(this.base)
      .pipe(
        tap(response => {
          this.cachedAccounts = response.results || [];
        }),
        catchError(error => {
          console.error('Erro ao buscar contas:', error);
          return of({ results: [] });
        })
      );
  }

  get(objectId: string): Observable<Account> {
    return this.http.get<Account>(`${this.base}/${encodeURIComponent(objectId)}`);
  }

  create(account: Account): Observable<Account> {
    return this.http.post<Account>(this.base, account)
      .pipe(
        tap(() => this.loadAccounts())
      );
  }

  update(objectId: string, payload: Partial<Account>): Observable<Account> {
    return this.http.put<Account>(`${this.base}/${encodeURIComponent(objectId)}`, payload)
      .pipe(
        tap(() => this.loadAccounts())
      );
  }

  delete(objectId: string): Observable<any> {
    return this.http.delete(`${this.base}/${encodeURIComponent(objectId)}`)
      .pipe(
        tap(() => this.loadAccounts())
      );
  }

  getCachedAccounts(): Account[] {
    return this.cachedAccounts;
  }

  private loadAccounts(): void {
    this.list().subscribe();
  }
}
