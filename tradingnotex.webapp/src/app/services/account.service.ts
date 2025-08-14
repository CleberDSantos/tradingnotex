import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class AccountService {
  private base = environment.apiBaseUrl.replace(/\/+$/, '') + '/api/classes/Account';
  private cachedAccounts: Account[] = [];

  constructor(private http: HttpClient) {
    // não carregue aqui; espere o componente/autenticação
  }

  list(params: {
    OrderBy?: string;
    Limit?: number;
    Skip?: number;
    IsActive?: boolean;
    AccountType?: string;
    Currency?: string;
    Broker?: string;
  } = { Limit: 50, Skip: 0, OrderBy: '-updatedAt' }): Observable<{ results: Account[] }> {

    // merge com defaults para garantir que o backend receba algo
    const merged = {
      Limit: 50,
      Skip: 0,
      OrderBy: '-updatedAt',
      ...params
    };

    let httpParams = new HttpParams()
      .set('Limit', String(merged.Limit))
      .set('Skip', String(merged.Skip))
      .set('OrderBy', merged.OrderBy ?? '-updatedAt');

    if (merged.IsActive !== undefined)
      httpParams = httpParams.set('IsActive', String(merged.IsActive));

    if (merged.AccountType && merged.AccountType.trim() !== '' && merged.AccountType !== 'ALL')
      httpParams = httpParams.set('AccountType', merged.AccountType);

    if (merged.Currency && merged.Currency.trim() !== '' && merged.Currency !== 'ALL')
      httpParams = httpParams.set('Currency', merged.Currency);

    if (merged.Broker && merged.Broker.trim() !== '' && merged.Broker !== 'ALL')
      httpParams = httpParams.set('Broker', merged.Broker);

    return this.http.get<{ results: Account[] }>(this.base, { params: httpParams }).pipe(
      tap(r => { this.cachedAccounts = r.results || []; }),
      catchError(err => {
        console.error('Erro ao buscar contas:', err);
        return of({ results: [] });
      })
    );
  }

  get(objectId: string) {
    return this.http.get<Account>(`${this.base}/${encodeURIComponent(objectId)}`);
  }

  create(account: Account) {
    return this.http.post<Account>(this.base, account).pipe(tap(() => this.list().subscribe()));
  }

  update(objectId: string, payload: Partial<Account>) {
    return this.http.put<Account>(`${this.base}/${encodeURIComponent(objectId)}`, payload)
      .pipe(tap(() => this.list().subscribe()));
  }

  delete(objectId: string) {
    return this.http.delete(`${this.base}/${encodeURIComponent(objectId)}`)
      .pipe(tap(() => this.list().subscribe()));
  }

  getCachedAccounts() { return this.cachedAccounts; }
}
