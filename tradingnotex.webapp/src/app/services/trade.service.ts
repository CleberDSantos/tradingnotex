import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Trade {
  objectId?: string;
  executedAtUTC: string;
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
  tradeStatus?: string;
  entryType?: number;
  spread?: number | null;
  otherFees?: number | null;
  targetPrice?: number | null;
  stopPrice?: number | null;
  execPrice?: number | null;
  openPrice?: number | null;
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
  screenshot?: string; // mantido para compatibilidade
  createdAt?: string;
  aiAnalysis?: string;
  aiAnalysisRendered?: {
    author: string;
    badge: string;
    text: string;
    timestamp: string;
    avatarType: string;
  };
  attachments?: Array<{
    type: string;
    data?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
  }>;
}

export interface ImportTradesPayload {
  name?: string;
  statementDateISO?: string;
  trades: Trade[];
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

    importTrades(payload: ImportTradesPayload): Observable<any> {
    const url = environment.apiBaseUrl.replace(/\/+$/, '') + '/api/functions/importTrades';

    // Garantir que o payload enviado inclua statementDateISO.
    // Se não vier preenchido, inferimos a partir do primeiro executedAtUTC disponível.
    let statementDateISO = payload.statementDateISO;
    if (!statementDateISO && payload.trades && payload.trades.length > 0) {
      try {
        const dates = payload.trades
          .map(t => (t && (t.executedAtUTC || (t as any).executedAtUTC) ? String((t as any).executedAtUTC) : ''))
          .filter(d => !!d)
          .map(d => new Date(d))
          .filter(d => !isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime());

        if (dates.length > 0) {
          // Use somente a parte de data (YYYY-MM-DD) — compatível com o que o backend costuma esperar
          statementDateISO = dates[0].toISOString().split('T')[0];
        }
      } catch (e) {
        // falha ao inferir, manter undefined
      }
    }

    const body: ImportTradesPayload = {
      name: payload.name,
      statementDateISO: statementDateISO,
      trades: payload.trades || []
    };

    // Log para depuração — veja no console do navegador o JSON enviado
    try {
      // eslint-disable-next-line no-console
      console.log('TradeService.importTrades -> sending payload:', JSON.stringify(body));
    } catch (e) {
      // ignore
    }

    const headers = { 'Content-Type': 'application/json' };
    return this.http.post<any>(url, body, { headers })
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
