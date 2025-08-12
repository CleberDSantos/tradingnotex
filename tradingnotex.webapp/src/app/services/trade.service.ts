import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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

export interface Comment {
  id: string;
  author?: string;
  text?: string;
  screenshot?: string;
  createdAt?: string;
  aiAnalysis?: string;
  attachments?: Array<{
    type: string;
    data?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
  }>;
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
      if (params.Instrument && params.Instrument.trim() !== '' && params.Instrument !== 'ALL') {
        httpParams = httpParams.set('Instrument', params.Instrument);
      }

      if (params.StartDate) {
        httpParams = httpParams.set('StartDate', params.StartDate.toISOString());
      }

      if (params.EndDate) {
        httpParams = httpParams.set('EndDate', params.EndDate.toISOString());
      }

      if (params.OrderBy) {
        httpParams = httpParams.set('OrderBy', params.OrderBy);
      }

      if (params.Limit !== undefined) {
        httpParams = httpParams.set('Limit', params.Limit.toString());
      }

      if (params.Skip !== undefined) {
        httpParams = httpParams.set('Skip', params.Skip.toString());
      }
    }

    return this.http.get<{results: Trade[]}>(this.base, { params: httpParams })
      .pipe(
        catchError(error => {
          console.error('Erro ao buscar trades:', error);
          return of({ results: [] });
        })
      );
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

    return this.http.get<KPIsResponse>(`${this.base}/kpis`, { params })
      .pipe(
        catchError(error => {
          console.error('Erro ao buscar KPIs:', error);
          return of({
            totalPL: 0,
            winRate: 0,
            expectancy: 0,
            maxGain: 0,
            maxLoss: 0,
            drawdown: 0,
            totalTrades: 0
          });
        })
      );
  }

  getHeatmap(): Observable<HourlyHeatmapResponse> {
    return this.http.get<HourlyHeatmapResponse>(`${this.base}/heatmap`)
      .pipe(
        catchError(error => {
          console.error('Erro ao buscar heatmap:', error);
          return of({
            heatmap: [],
            bestHour: { hour: 0, pl: 0 },
            worstHour: { hour: 0, pl: 0 }
          });
        })
      );
  }

  getInsights(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/insights`)
      .pipe(
        catchError(error => {
          console.error('Erro ao buscar insights:', error);
          return of([
            'Carregando insights...',
            'Verifique sua conexão com a API'
          ]);
        })
      );
  }

  listComments(objectId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/${encodeURIComponent(objectId)}/comments`)
      .pipe(
        catchError(error => {
          console.error('Erro ao buscar comentários:', error);
          return of([]);
        })
      );
  }

  importTrades(payload: { name?: string; statementDateISO?: string; trades?: any[] }): Observable<any> {
    const url = environment.apiBaseUrl.replace(/\/+$/, '') + '/api/functions/importTrades';
    return this.http.post<any>(url, payload)
      .pipe(
        catchError(error => {
          console.error('Erro ao importar trades:', error);
          return of({ success: false, error: error });
        })
      );
  }

  addComment(objectId: string, payload: { text?: string; screenshot?: string; attachments?: any[] }): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/${encodeURIComponent(objectId)}/comments`, payload);
  }

  analyzeComment(objectId: string, commentId: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/${encodeURIComponent(objectId)}/comments/${encodeURIComponent(commentId)}/analyze`, {});
  }

  updateDetails(objectId: string, payload: Partial<Trade>): Observable<Trade> {
    return this.http.put<Trade>(`${this.base}/${encodeURIComponent(objectId)}/details`, payload);
  }
}
