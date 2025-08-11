import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RiskService {
  private base = environment.apiBaseUrl.replace(/\/+$/, '') + '/api/functions';

  constructor(private http: HttpClient) {}

  evaluateRiskDay(day: string, goalEUR: number, maxLossEUR: number): Observable<any> {
    return this.http.post(`${this.base}/evaluateRiskDay`, { day, goalEUR, maxLossEUR });
  }

  evaluateRiskRange(start: string, end: string, goalEUR: number, maxLossEUR: number): Observable<any> {
    return this.http.post(`${this.base}/evaluateRiskRange`, { start, end, goalEUR, maxLossEUR });
  }
}
