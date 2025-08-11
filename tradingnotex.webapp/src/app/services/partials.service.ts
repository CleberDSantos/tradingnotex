import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface PartialPlanRequest {
  stopPts: number;
  contracts: number;
  direction?: string;
  entry: number;
  r1: number;
  r2: number;
  r3: number;
  p1: number;
  p2: number;
  p3: number;
  usdPerPointPerContract?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PartialsService {
  private base = environment.apiBaseUrl.replace(/\/+$/, '') + '/api/functions';

  constructor(private http: HttpClient) {}

  generatePartialPlan(payload: PartialPlanRequest): Observable<any> {
    return this.http.post(`${this.base}/generatePartialPlan`, payload);
  }

  optimizePartials(payload: { stopPts: number; contracts: number; targetR: number; curvePreset?: string }): Observable<any> {
    return this.http.post(`${this.base}/optimizePartials`, payload);
  }
}
