import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Trade {
  objectId?: string;
  executedAtUTC?: string;
  instrument?: string;
  side?: string;
  realizedPLEUR?: number;
  durationMin?: number;
  setup?: string;
  emotion?: { mood?: string; arousal?: string };
  notes?: string;
  tags?: string[];
  importId?: string;
  ownerId?: string;
  entryType?: number;
  greed?: boolean;
  youtubeLink?: string;
  comments?: any[];
  dailyGoalReached?: boolean;
  dailyLossReached?: boolean;
}

export interface KPIsResponse {
  totalPL: number;
  winRate: number;
  expectancy: number;
  maxGain: number;
  maxLoss: number;
  drawdown: number;
  totalTrades: number;
}

export interface HourlyHeatmapResponse {
  heatmap: Array<{hour: number, pl: number, trades: number}>;
  bestHour: {hour: number, pl: number};
  worstHour: {hour: number, pl: number};
}

@Injectable({
  providedIn: 'root'
})
export class TradeService {
  private base = environment.apiBaseUrl.replace(/\/+$/, '') + '/api/classes/Trade';

  constructor(private http: HttpClient) {}

  list(params?: { 
    Instrument?: string; 
    StartDate?: Date; 
    EndDate?: Date; 
    OrderBy?: string; 
    Limit?: number; 
    Skip?: number 
  }): Observable<{results: Trade[]}> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const v: any = (params as any)[key];
        if (v !== undefined && v !== null) {
          if (v instanceof Date) {
            httpParams = httpParams.set(key, v.toISOString());
          } else {
            httpParams = httpParams.set(key, String(v));
          }
        }
      });
    }
    return this.http.get<{results: Trade[]}>(this.base, { params: httpParams });
  }

  get(objectId: string): Observable<Trade> {
    return this.http.get<Trade>(`${this.base}/${encodeURIComponent(objectId)}`);
  }

  create(trade: Trade): Observable<Trade> {
    return this.http.post<Trade>(this.base, trade);
  }

  update(objectId: string, payload: Partial<Trade>): Observable<Trade> {
    return this.http.put<Trade>(`${this.base}/${encodeURIComponent(objectId)}`, payload);
  }

  delete(objectId: string): Observable<any> {
    return this.http.delete(`${this.base}/${encodeURIComponent(objectId)}`);
  }

  getKPIs(startDate?: string, endDate?: string): Observable<KPIsResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<KPIsResponse>(`${this.base}/kpis`, { params });
  }

  getHeatmap(): Observable<HourlyHeatmapResponse> {
    return this.http.get<HourlyHeatmapResponse>(`${this.base}/heatmap`);
  }

  getInsights(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/insights`);
  }

  // Métodos para comentários
  listComments(objectId: string): Observable<any> {
    return this.http.get(`${this.base}/${encodeURIComponent(objectId)}/comments`);
  }

  addComment(objectId: string, payload: { text?: string; screenshot?: string }): Observable<any> {
    return this.http.post(`${this.base}/${encodeURIComponent(objectId)}/comments`, payload);
  }

  analyzeComment(objectId: string, commentId: string): Observable<any> {
    return this.http.post(`${this.base}/${encodeURIComponent(objectId)}/comments/${encodeURIComponent(commentId)}/analyze`, {});
  }

  // Método para atualizar detalhes do trade
  updateDetails(objectId: string, payload: Partial<Trade>): Observable<any> {
    return this.http.put(`${this.base}/${encodeURIComponent(objectId)}/details`, payload);
  }
}
