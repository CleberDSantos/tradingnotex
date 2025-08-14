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
import { Account, AccountService } from '../services/account.service';

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

  // Contas
  accounts: Account[] = [];

  // Instrumentos
  availableInstruments: string[] = [];
  selectedInstruments = new Set<string>();
  showInstrumentDropdown = false;

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
    accountId: '',
    instrument: '',
    startDate: '',
    endDate: '',
    groupBy: 'instrument'
  };

  // Charts
  charts: any = {};

  constructor(
    private tradeService: TradeService,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAccounts();
    this.loadAvailableInstruments();
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    Object.values(this.charts).forEach((chart: any) => {
      if (chart && chart.dispose) {
        chart.dispose();
      }
    });
  }

  loadAccounts() {
    this.accountService.list()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.accounts = response.results || [];
        },
        error: (error) => {
          console.error('Erro ao carregar contas:', error);
        }
      });
  }

  loadAvailableInstruments() {
    // Buscar todos os trades para extrair instrumentos únicos
    this.tradeService.list({ Limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const trades = response.results || [];
          const instruments = new Set<string>();
          trades.forEach(trade => {
            if (trade.instrument) {
              instruments.add(trade.instrument);
            }
          });
          this.availableInstruments = Array.from(instruments).sort();
        },
        error: (error) => {
          console.error('Erro ao carregar instrumentos:', error);
        }
      });
  }

  toggleInstrumentDropdown() {
    this.showInstrumentDropdown = !this.showInstrumentDropdown;
  }

  toggleAllInstruments() {
    if (this.selectedInstruments.size === 0) {
      // Se todos estão selecionados, desmarcar todos
      this.availableInstruments.forEach(inst => {
        this.selectedInstruments.add(inst);
      });
    } else {
      // Se algum está selecionado, limpar todos
      this.selectedInstruments.clear();
    }
  }

  toggleInstrument(instrument: string) {
    if (this.selectedInstruments.has(instrument)) {
      this.selectedInstruments.delete(instrument);
    } else {
      this.selectedInstruments.add(instrument);
    }
  }

  getSelectedInstrumentsText(): string {
    if (this.selectedInstruments.size === 0) {
      return 'Todos';
    } else if (this.selectedInstruments.size === 1) {
      return Array.from(this.selectedInstruments)[0];
    } else if (this.selectedInstruments.size <= 3) {
      return Array.from(this.selectedInstruments).join(', ');
    } else {
      return `${this.selectedInstruments.size} selecionados`;
    }
  }

  getAccountName(accountId: string | undefined): string {
    if (!accountId) return '';
    const account = this.accounts.find(a => a.objectId === accountId);
    return account ? account.name : '';
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

  loadTrades() {
    const filter: any = {
      OrderBy: '-executedAtUTC',
      Limit: 100
    };

    // Filtro de conta
    if (this.filters.accountId) {
      filter.AccountId = this.filters.accountId;
    }

    // Filtro de instrumentos (múltiplos)
    if (this.selectedInstruments.size > 0 && this.selectedInstruments.size < this.availableInstruments.length) {
      filter.Instruments = Array.from(this.selectedInstruments);
    }

    if (this.filters.startDate) {
      filter.StartDate = new Date(this.filters.startDate);
    }

    if (this.filters.endDate) {
      filter.EndDate = new Date(this.filters.endDate);
    }

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

  applyFilters() {
    this.currentPage = 0;
    this.loadDashboardData();
  }

  clearFilters() {
    this.filters = {
      accountId: '',
      instrument: '',
      startDate: '',
      endDate: '',
      groupBy: 'instrument'
    };
    this.selectedInstruments.clear();
    this.currentPage = 0;
    this.loadDashboardData();
  }

  openTradeDetail(tradeId: string) {
    if (!tradeId) {
      console.error('Trade ID não fornecido');
      return;
    }
    this.router.navigate(['/trade', tradeId]);
  }

  loadMoreTrades() {
    if (this.loading) return;

    this.currentPage++;
    const filter: any = {
      OrderBy: '-executedAtUTC',
      Skip: this.currentPage * this.pageSize,
      Limit: this.pageSize
    };

    if (this.filters.accountId) {
      filter.AccountId = this.filters.accountId;
    }

    if (this.selectedInstruments.size > 0 && this.selectedInstruments.size < this.availableInstruments.length) {
      filter.Instruments = Array.from(this.selectedInstruments);
    }

    this.loading = true;

    this.tradeService.list(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.trades = [...this.trades, ...(response.results || [])];
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar mais trades', error);
          this.error = 'Erro ao carregar mais trades';
          this.loading = false;
          this.currentPage--;
        }
      });
  }

  // Update functions
  private updateKPIs30Days() {
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
        case 'account':
          key = this.getAccountName(trade.accountId) || 'Sem conta';
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
}
