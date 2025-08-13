import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { TradeService } from '../services/trade.service';
import { NgIf, NgFor, CurrencyPipe, DatePipe, DecimalPipe, NgClass, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { RiskComponent } from '../risk/risk';
import { EvolutionComponent } from '../evolution/evolution';
import { AchievementsComponent } from '../achievements/achievements';

declare var echarts: any;



import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor, CurrencyPipe, DatePipe, DecimalPipe, NgClass, RiskComponent, EvolutionComponent, AchievementsComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Dashboard implements OnInit, OnDestroy, AfterViewInit {
  Math = Math;
  private destroy$ = new Subject<void>();

  // Estados principais
  loading = false;
  error: string | null = null;

  // Tabs
  activeTab = 'risk';

  currentPage = 0;
  pageSize = 20;



  // KPIs
  kpis = {
    totalPL: 0,
    winRate: 0,
    expectancy: 0,
    maxGain: 0,
    maxLoss: 0,
    drawdown: 0,
    totalTrades: 0
  };

  kpis30Days = {
    pl: 0,
    winRate: 0,
    expectancy: 0,
    payoff: '1.8:1',
    maeMfe: '-€3.1 / €8.4',
    maxDD: '—',
    ddRecover: '—'
  };

  // Dados
  trades: any[] = [];
  insights: string[] = [];
  heatmapData: any = null;
  pivotData: any[] = [];

  // Filtros
  filters = {
    instrument: '',
    startDate: '',
    endDate: '',
    groupBy: 'instrument'
  };

  // Risk Management
  riskData = {
    goalEUR: 2.00,
    maxLossEUR: 2.00,
    selectedDay: '',
    impact: 0,
    greedDays: 0,
    lossDays: 0,
    compliantDays: 0
  };

  // Partial Plan
  partialPlan = {
    stopPts: 12,
    contracts: 2,
    direction: 'long',
    entry: 20000,
    r1: 1.0,
    r2: 1.5,
    r3: 2.0,
    p1: 50,
    p2: 30,
    p3: 20
  };

  // Charts
  charts: any = {};

  constructor(
    private tradeService: TradeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData();

  }

  ngAfterViewInit() {
    // Inicializar gráficos após a view estar pronta
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Destruir gráficos
    Object.values(this.charts).forEach((chart: any) => {
      if (chart && chart.dispose) {
        chart.dispose();
      }
    });
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    this.loadKPIs();
    this.loadTrades();
    this.loadInsights();
    this.loadHeatmap();
  }

  loadKPIs() {
    const startDate = this.filters.startDate ? new Date(this.filters.startDate) : undefined;
    const endDate = this.filters.endDate ? new Date(this.filters.endDate) : undefined;

    this.tradeService.getKPIs(
      startDate?.toISOString().split('T')[0],
      endDate?.toISOString().split('T')[0]
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.kpis = data;
        this.updateKPIs30Days();
      },
      error: (error) => {
        console.error('Erro ao carregar KPIs', error);
      }
    });
  }

  getTradeIcon(trade: any): string {
    if (trade.realizedPLEUR > 5) return '🚀'; // Grande vitória
    if (trade.realizedPLEUR > 0) return '✅'; // Vitória
    if (trade.realizedPLEUR < -5) return '💥'; // Grande perda
    if (trade.realizedPLEUR < 0) return '❌'; // Perda
    return '➖'; // Break even
  }

  formatTradeDuration(minutes: number | null): string {
    if (!minutes) return '-';

    if (minutes < 60) {
      return `${minutes}min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days}d`;
    }
  }

   getTradeStats(trade: any): any {
    const stats = {
      riskRewardRatio: 0,
      percentageGain: 0,
      isWinner: trade.realizedPLEUR > 0,
      hasComments: trade.comments && trade.comments.length > 0,
      hasAnalysis: trade.comments?.some((c: any) => c.aiAnalysis),
      hasVideo: !!trade.youtubeLink
    };

    // Calcular R:R aproximado (assumindo risco de €2)
    const assumedRisk = 2;
    stats.riskRewardRatio = Math.abs(trade.realizedPLEUR / assumedRisk);

    // Calcular percentual (assumindo capital de €100)
    const assumedCapital = 100;
    stats.percentageGain = (trade.realizedPLEUR / assumedCapital) * 100;

    return stats;
  }



  loadTrades() {
    const filter = {
      // Evita erro 400: campo Instrument obrigatório na API
      Instrument: this.filters.instrument && this.filters.instrument.trim() !== '' ? this.filters.instrument : 'ALL',
      StartDate: this.filters.startDate ? new Date(this.filters.startDate) : undefined,
      EndDate: this.filters.endDate ? new Date(this.filters.endDate) : undefined,
      OrderBy: '-executedAtUTC',
      Limit: 100
    };

    this.tradeService.list(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.trades = response.results || [];
          this.updatePivotData();
          this.updateCharts();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar trades', error);
          this.error = 'Erro ao carregar trades';
          this.loading = false;
        }
      });
  }

  loadInsights() {
    this.tradeService.getInsights()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.insights = data;
        },
        error: (error) => {
          console.error('Erro ao carregar insights', error);
        }
      });
  }

  loadHeatmap() {
    this.tradeService.getHeatmap()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.heatmapData = data;
          this.updateHeatmapChart();
        },
        error: (error) => {
          console.error('Erro ao carregar heatmap', error);
        }
      });
  }

  // Funções de UI
  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'evolution') {
      setTimeout(() => this.initEvolutionChart(), 100);
    }
  }




 applyFilters() {
    this.currentPage = 0;
    this.loadDashboardData();
  }

  clearFilters() {
    this.filters = {
      instrument: '',
      startDate: '',
      endDate: '',
      groupBy: 'instrument'
    };
    this.currentPage = 0;
    this.loadDashboardData();
  }

  private buildTradeFilter(): any {
    const filter: any = {
      OrderBy: '-executedAtUTC',
      Limit: this.pageSize,
      Skip: 0
    };

    // Não adicionar Instrument se estiver vazio ou for "ALL"
    if (this.filters.instrument &&
        this.filters.instrument.trim() !== '' &&
        this.filters.instrument.toUpperCase() !== 'ALL') {
      filter.Instrument = this.filters.instrument;
    }

    if (this.filters.startDate) {
      filter.StartDate = new Date(this.filters.startDate);
    }

    if (this.filters.endDate) {
      filter.EndDate = new Date(this.filters.endDate);
    }

    return filter;
  }

  // Importar arquivo (JSON ou CSV) e enviar para API /api/functions/importTrades
  handleFileInput(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text: string = e.target.result;

      if (this._parseJsonTrades(text, file.name)) {
        return;
      }

      if (this._parseCsvTrades(text, file.name)) {
        return;
      }

      this.error = 'Formato de arquivo não suportado. Envie JSON com chave "trades" ou CSV com cabeçalho.';
    };
    reader.readAsText(file);
  }

  private _parseJsonTrades(text: string, fileName: string): boolean {
    try {
      const json = JSON.parse(text);

      // Caso padrão: objeto com chave "trades" (pode também incluir "name" e "statementDateISO")
      if (json && Array.isArray(json.trades)) {
        const name = json.name || fileName;
        const statementDateISO = json.statementDateISO || undefined;
        this.importTradesPayload(name, statementDateISO, json.trades);
        return true;
      }

      // Formato simples: o arquivo é um array de trades
      if (Array.isArray(json)) {
        this.importTradesPayload(fileName, undefined, json);
        return true;
      }

      // Compatibilidade: objeto que inclui explicitamente name e statementDateISO
      if (json && json.name && json.statementDateISO) {
        this.importTradesPayload(json.name, json.statementDateISO, json.trades || []);
        return true;
      }
    } catch {
      // não é JSON válido
    }
    return false;
  }

  private _parseCsvTrades(text: string, fileName: string): boolean {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 1 && lines[0].includes(',')) {
      const headers = lines[0].split(',').map(h => h.trim());
      const trades = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx];
        });
        if (obj.realizedPLEUR !== undefined) obj.realizedPLEUR = parseFloat(String(obj.realizedPLEUR)) || 0;
        if (obj.durationMin !== undefined) obj.durationMin = obj.durationMin ? parseInt(String(obj.durationMin), 10) : undefined;
        return obj;
      });
      this.importTradesPayload(fileName, undefined, trades);
      return true;
    }
    return false;
  }

  private validateAndNormalizeTrades(trades: any[]): { valid: boolean; errors: string[]; normalized: any[] } {
    const errors: string[] = [];
    const normalized: any[] = trades.map((t: any, idx: number) => {
      const row = t || {};
      const n: any = {};

      // executedAtUTC -> ISO string required
      if (row.executedAtUTC) {
        const d = new Date(row.executedAtUTC);
        if (isNaN(d.getTime())) {
          errors.push(`Linha ${idx + 1}: campo 'executedAtUTC' inválido ("${row.executedAtUTC}") — deve ser uma data ISO.`);
        } else {
          n.executedAtUTC = d.toISOString();
        }
      } else {
        errors.push(`Linha ${idx + 1}: campo 'executedAtUTC' ausente.`);
      }

      // instrument (string)
      n.instrument = row.instrument ? String(row.instrument) : '';
      if (!n.instrument) {
        errors.push(`Linha ${idx + 1}: campo 'instrument' ausente ou vazio.`);
      }

      // side (buy|sell) — aceitar também BUY/SELL e variações
      const side = row.side ? String(row.side).toLowerCase() : '';
      if (side === 'buy' || side === 'sell') {
        n.side = side;
      } else {
        errors.push(`Linha ${idx + 1}: campo 'side' inválido ("${row.side}"). Use "buy" ou "sell".`);
      }

      // realizedPLEUR (number)
      if (row.realizedPLEUR !== undefined && row.realizedPLEUR !== null && row.realizedPLEUR !== '') {
        const val = Number(row.realizedPLEUR);
        if (isNaN(val)) {
          errors.push(`Linha ${idx + 1}: 'realizedPLEUR' não é um número ("${row.realizedPLEUR}").`);
          n.realizedPLEUR = 0;
        } else {
          n.realizedPLEUR = val;
        }
      } else {
        n.realizedPLEUR = 0;
      }

      // durationMin (integer) — garantir campo presente (API espera number)
      if (row.durationMin !== undefined && row.durationMin !== null && row.durationMin !== '') {
        const dm = Number(row.durationMin);
        n.durationMin = isNaN(dm) ? 0 : Math.round(dm);
      } else {
        n.durationMin = 0;
      }

      // optional fields passthrough (setup, notes, tags, youtubeLink, etc.)
      if (row.setup) n.setup = row.setup;
      if (row.notes) n.notes = row.notes;
      if (row.tags) n.tags = Array.isArray(row.tags) ? row.tags : String(row.tags).split(',').map((s: string) => s.trim());
      if (row.youtubeLink) n.youtubeLink = row.youtubeLink;

      return n;
    });

    return { valid: errors.length === 0, errors, normalized };
  }

  private importTradesPayload(name?: string, statementDateISO?: string, trades?: any[]) {
    if (!trades || trades.length === 0) {
      this.error = 'Nenhum trade encontrado para importar.';
      return;
    }

    // Validar e normalizar antes de enviar ao servidor
    const validation = this.validateAndNormalizeTrades(trades);
    if (!validation.valid) {
      // Não enviar se houver erros de validação — mostrar detalhes ao usuário
      this.error = `Erros de validação detectados:\n${validation.errors.join('\n')}`;
      console.error('Erros de validação antes de enviar import:', validation.errors);
      return;
    }

    const normalizedTrades = validation.normalized;

    // Mostrar loading leve
    this.loading = true;
    this.error = null;

    // Se statementDateISO não foi fornecido pelo arquivo, inferimos a partir do primeiro executedAtUTC válido
    let inferredStatementDateISO: string | undefined = statementDateISO;
    if (!inferredStatementDateISO && normalizedTrades && normalizedTrades.length > 0) {
      // Escolher o menor executedAtUTC (primeiro cronologicamente)
      try {
        inferredStatementDateISO = normalizedTrades
          .map((t: any) => t.executedAtUTC)
          .filter((d: any) => !!d)
          .sort()[0];
      } catch (e) {
        inferredStatementDateISO = normalizedTrades[0].executedAtUTC;
      }
    }

    this.tradeService.importTrades({
      name,
      statementDateISO: inferredStatementDateISO,
      trades: normalizedTrades
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        // Se backend devolver objeto de erros de validação, mostre ao usuário
        if (res && (res.success === false || res.errors)) {
          // Salva localmente como fallback
          localStorage.setItem('importedTrades', JSON.stringify(normalizedTrades));
          const details = res.errors ? JSON.stringify(res.errors, null, 2) : JSON.stringify(res);
          this.error = `Importação falhou no servidor. Detalhes: ${details}. Dados salvos localmente.`;
          console.error('Importação falhou:', res);
          return;
        }

        // atualizar lista local e gráficos
        this.loadDashboardData();

      },
      error: (err) => {
        console.error('Erro na importação:', err);
        this.loading = false;

        // Tentar extrair detalhes de validação do corpo de erro retornado pelo servidor
        let serverMsg = 'Erro ao enviar para servidor. Dados salvos localmente.';
        try {
          const se = err?.error;
          if (se) {
            // Se for objeto de validação (RFC problem details), montamos mensagem legível
            if (se.title || se.errors) {
              const trace = se.traceId ? ` traceId: ${se.traceId}` : '';
              const errors = se.errors ? JSON.stringify(se.errors, null, 2) : '';
              serverMsg = `Servidor respondeu: ${se.title || 'Erro'}${trace}. Erros: ${errors}`;
            } else {
              serverMsg = typeof se === 'string' ? se : JSON.stringify(se);
            }
          } else if (err.message) {
            serverMsg = err.message;
          }
        } catch (e) {
          serverMsg = 'Erro desconhecido do servidor.';
        }

        // fallback: salvar localmente
        localStorage.setItem('importedTrades', JSON.stringify(normalizedTrades));
        this.error = serverMsg;
      }
    });
  }

  loadDemo() {
    const demo = {
      trades: [
        { executedAtUTC: '2025-08-07T13:46:41Z', instrument: 'TECH100', side: 'sell', realizedPLEUR: 4.84, setup: 'SMC' },
        { executedAtUTC: '2025-08-07T13:56:21Z', instrument: 'TECH100', side: 'buy', realizedPLEUR: -1.61, setup: 'SMC' },
        { executedAtUTC: '2025-08-07T14:24:58Z', instrument: 'TECH100', side: 'sell', realizedPLEUR: -3.15, setup: 'SMC' },
        { executedAtUTC: '2025-08-07T16:40:59Z', instrument: 'TECH100', side: 'buy', realizedPLEUR: 5.41, setup: 'SMC' },
        { executedAtUTC: '2025-08-07T17:37:35Z', instrument: 'TECH100', side: 'sell', realizedPLEUR: -2.73, setup: 'SMC' },
        { executedAtUTC: '2025-08-08T10:02:06Z', instrument: 'TECH100', side: 'buy', realizedPLEUR: -0.37, setup: 'SMC' },
        { executedAtUTC: '2025-08-08T10:53:47Z', instrument: 'TECH100', side: 'sell', realizedPLEUR: 0.92, setup: 'SMC' },
        { executedAtUTC: '2025-08-08T12:50:07Z', instrument: 'TECH100', side: 'buy', realizedPLEUR: 1.17, setup: 'SMC' },
        { executedAtUTC: '2025-08-09T09:15:00Z', instrument: 'SPX500', side: 'buy', realizedPLEUR: 3.25, setup: 'SMC' },
        { executedAtUTC: '2025-08-09T11:30:00Z', instrument: 'SPX500', side: 'sell', realizedPLEUR: -1.85, setup: 'SMC' }
      ]
    };
    this.trades = demo.trades;
    localStorage.setItem('importedTrades', JSON.stringify(this.trades));
    this.updatePivotData();
    this.updateCharts();
  }

  // Navegação para detalhes do trade


  openTradeDetail(tradeId: string) {
    if (!tradeId) {
      console.error('Trade ID não fornecido');
      return;
    }

    // Navegar para a página de detalhes
    this.router.navigate(['/trade', tradeId]);
  }

  loadMoreTrades() {
    if (this.loading) return;

    this.currentPage++;
    const filter = this.buildTradeFilter();
    filter.Skip = this.currentPage * this.pageSize;
    filter.Limit = this.pageSize;

    this.loading = true;

    this.tradeService.list(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Adicionar trades à lista existente
          this.trades = [...this.trades, ...(response.results || [])];
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar mais trades', error);
          this.error = 'Erro ao carregar mais trades';
          this.loading = false;
          this.currentPage--; // Reverter página em caso de erro
        }
      });
  }

  // Update functions
  private updateKPIs30Days() {
    // Simular dados dos últimos 30 dias
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last30Trades = this.trades.filter(t =>
      new Date(t.executedAtUTC) >= thirtyDaysAgo
    );

    if (last30Trades.length > 0) {
      const pl = last30Trades.reduce((sum, t) => sum + (t.realizedPLEUR || 0), 0);
      const wins = last30Trades.filter(t => t.realizedPLEUR > 0).length;

      this.kpis30Days = {
        pl: pl,
        winRate: (wins / last30Trades.length) * 100,
        expectancy: pl / last30Trades.length,
        payoff: '1.8:1',
        maeMfe: '-€3.1 / €8.4',
        maxDD: '€45.23',
        ddRecover: '5 dias'
      };
    }
  }

  private updatePivotData() {
    const groupBy = this.filters.groupBy;
    const grouped = new Map<string, any[]>();

    this.trades.forEach(trade => {
      let key = '';
      const date = new Date(trade.executedAtUTC);

      switch (groupBy) {
        case 'instrument':
          key = trade.instrument;
          break;
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          key = `${date.getFullYear()}-W${this.getWeekNumber(date)}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'hour':
          key = `${date.getHours()}:00`;
          break;
        case 'side':
          key = trade.side;
          break;
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(trade);
    });

    this.pivotData = Array.from(grouped.entries()).map(([name, trades]) => {
      const pl = trades.reduce((sum, t) => sum + (t.realizedPLEUR || 0), 0);
      const wins = trades.filter(t => t.realizedPLEUR > 0).length;
      const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
      const best = Math.max(...trades.map(t => t.realizedPLEUR || 0));
      const worst = Math.min(...trades.map(t => t.realizedPLEUR || 0));
      const avg = trades.length > 0 ? pl / trades.length : 0;
      const positivePL = trades.filter(t => t.realizedPLEUR > 0)
        .reduce((sum, t) => sum + t.realizedPLEUR, 0);
      const negativePL = Math.abs(trades.filter(t => t.realizedPLEUR < 0)
        .reduce((sum, t) => sum + t.realizedPLEUR, 0));
      const plPositiveShare = (positivePL + negativePL) > 0
        ? (positivePL / (positivePL + negativePL)) * 100
        : 0;

      return {
        name,
        trades: trades.length,
        pl,
        avg,
        winRate,
        plPositiveShare,
        best,
        worst
      };
    }).sort((a, b) => b.pl - a.pl);
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Charts initialization
  private initCharts() {
    this.initEquityChart();
    this.initDailyChart();
    this.initMonthlyChart();
    this.initRiskChart();
  }

  private initEquityChart() {
    const el = document.getElementById('chartEquity');
    if (!el) return;

    this.charts.equity = echarts.init(el, 'dark');
    this.updateEquityChart();
  }

  private initDailyChart() {
    const el = document.getElementById('chartDaily');
    if (!el) return;

    this.charts.daily = echarts.init(el, 'dark');
    this.updateDailyChart();
  }

  private initMonthlyChart() {
    const el = document.getElementById('chartMonthlyBars');
    if (!el) return;

    this.charts.monthly = echarts.init(el, 'dark');
    this.updateMonthlyChart();
  }

  private initRiskChart() {
    const el = document.getElementById('chartDailyComparison');
    if (!el) return;

    this.charts.risk = echarts.init(el, 'dark');
    // Configurar gráfico de risco
  }

  private initEvolutionChart() {
    const el = document.getElementById('evolutionChart');
    if (!el) return;

    this.charts.evolution = echarts.init(el, 'dark');

    const months = ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'];
    const equity = [0, 234, 456, 387, 678, 892];
    const winRate = [45, 52, 58, 54, 62, 68];
    const avgTrades = [8, 7, 6, 7, 5, 4];

    this.charts.evolution.setOption({
      backgroundColor: 'transparent',
      grid: { top: 40, right: 60, bottom: 30, left: 50 },
      legend: { top: 5, textStyle: { color: '#9ca3af' } },
      xAxis: { type: 'category', data: months, axisLabel: { color: '#9ca3af' } },
      yAxis: [
        { type: 'value', name: '€', position: 'left', axisLabel: { color: '#9ca3af' } },
        { type: 'value', name: '%', position: 'right', axisLabel: { color: '#9ca3af' } }
      ],
      series: [
        {
          name: 'Equity',
          type: 'line',
          smooth: true,
          data: equity,
          itemStyle: { color: '#10b981' },
          areaStyle: { opacity: 0.1 }
        },
        {
          name: 'Win Rate',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: winRate,
          itemStyle: { color: '#22d3ee' }
        },
        {
          name: 'Trades/Dia',
          type: 'bar',
          data: avgTrades,
          itemStyle: { color: '#f59e0b', opacity: 0.5 }
        }
      ],
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } }
    });
  }

  private updateCharts() {
    this.updateEquityChart();
    this.updateDailyChart();
    this.updateMonthlyChart();
  }

  private updateEquityChart() {
    if (!this.charts.equity) return;

    let cumulative = 0;
    const data = this.trades
      .sort((a, b) => new Date(a.executedAtUTC).getTime() - new Date(b.executedAtUTC).getTime())
      .map(trade => {
        cumulative += trade.realizedPLEUR || 0;
        return [trade.executedAtUTC, cumulative.toFixed(2)];
      });

    this.charts.equity.setOption({
      backgroundColor: 'transparent',
      title: { text: 'Curva de Equity', left: 10, top: 8, textStyle: { color: '#e5e7eb' } },
      grid: { top: 50, right: 20, bottom: 30, left: 45 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'time', axisLabel: { color: '#9ca3af' } },
      yAxis: { type: 'value', axisLabel: { color: '#9ca3af' } },
      series: [{
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#10b981' },
        data: data
      }]
    });
  }

  private updateDailyChart() {
    if (!this.charts.daily) return;

    const byDay: { [key: string]: number } = {};
    this.trades.forEach(trade => {
      const day = trade.executedAtUTC.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + (trade.realizedPLEUR || 0);
    });

    const days = Object.keys(byDay).sort();

    this.charts.daily.setOption({
      backgroundColor: 'transparent',
      title: { text: 'P/L por Dia', left: 10, top: 8, textStyle: { color: '#e5e7eb' } },
      grid: { top: 50, right: 20, bottom: 30, left: 45 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: days, axisLabel: { color: '#9ca3af' } },
      yAxis: { type: 'value', axisLabel: { color: '#9ca3af' } },
      series: [{
        type: 'bar',
        data: days.map(d => ({
          value: byDay[d].toFixed(2),
          itemStyle: { color: byDay[d] >= 0 ? '#10b981' : '#ef4444' }
        }))
      }]
    });
  }

  private updateMonthlyChart() {
    if (!this.charts.monthly) return;

    const byMonth: { [key: string]: number } = {};
    this.trades.forEach(trade => {
      const date = new Date(trade.executedAtUTC);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[month] = (byMonth[month] || 0) + (trade.realizedPLEUR || 0);
    });

    const months = Object.keys(byMonth).sort();

    this.charts.monthly.setOption({
      backgroundColor: 'transparent',
      title: { text: 'P/L Mensal', left: 10, top: 8, textStyle: { color: '#e5e7eb' } },
      grid: { top: 60, right: 60, bottom: 40, left: 50 },
      legend: { top: 8, right: 10, textStyle: { color: '#cbd5e1' } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: months, axisLabel: { color: '#9ca3af' } },
      yAxis: [
        { type: 'value', name: '€', axisLabel: { color: '#9ca3af' } }
      ],
      series: [{
        name: 'P/L (€)',
        type: 'bar',
        data: months.map(m => byMonth[m].toFixed(2)),
        itemStyle: { color: '#22d3ee' }
      }]
    });
  }

  private updateHeatmapChart() {
    const el = document.getElementById('heatmapHoraDia');
    if (!el || !this.heatmapData) return;

    const chart = echarts.init(el, 'dark');

    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const data: any[] = [];

    // Criar dados do heatmap
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const hourData = this.heatmapData.heatmap.find((hd: any) => hd.hour === h);
        data.push([h, d, hourData ? hourData.pl : 0]);
      }
    }

    chart.setOption({
      tooltip: {
        position: 'top',
        formatter: (p: any) => `${days[p.data[1]]} ${hours[p.data[0]]}: €${p.data[2]}`
      },
      grid: { height: '70%', top: 30, left: 60, right: 20 },
      xAxis: { type: 'category', data: hours, splitArea: { show: true }, axisLabel: { color: '#9ca3af' } },
      yAxis: { type: 'category', data: days, splitArea: { show: true }, axisLabel: { color: '#9ca3af' } },
      visualMap: {
        min: -20,
        max: 20,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: { color: ['#ef4444', '#1f2937', '#10b981'] },
        textStyle: { color: '#9ca3af' }
      },
      series: [{
        name: 'P/L',
        type: 'heatmap',
        data: data,
        emphasis: { itemStyle: { shadowBlur: 10 } }
      }]
    });
  }

  // Utility functions
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getTradeProfitClass(pl: number): string {
    return pl >= 0 ? 'text-good' : 'text-bad';
  }

  getKPIClass(value: number, type: 'pl' | 'rate' | 'neutral'): string {
    switch (type) {
      case 'pl':
        return value >= 0 ? 'text-good' : 'text-bad';
      case 'rate':
        return value >= 50 ? 'text-good' : 'text-bad';
      default:
        return 'text-cyanx';
    }
  }

  // Math utility functions for template usage
  getHeatmapOpacity(pl: number): string {
    const opacity = Math.min(Math.abs(pl) / 10, 1);
    return pl >= 0 ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
  }
}
