import { Component, OnInit, OnDestroy } from '@angular/core';
import { TradeService } from '../services/trade.service';
import { NgIf, NgFor, CurrencyPipe, DatePipe, NgClass, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

interface KPIData {
  totalPL: number;
  winRate: number;
  expectancy: number;
  maxGain: number;
  maxLoss: number;
  drawdown: number;
  totalTrades: number;
}

interface Trade {
  objectId?: string;
  executedAtUTC?: string;
  instrument?: string;
  side?: string;
  realizedPLEUR?: number;
  setup?: string;
  emotion?: any;
}

interface HeatmapData {
  heatmap: Array<{hour: number, pl: number, trades: number}>;
  bestHour: {hour: number, pl: number};
  worstHour: {hour: number, pl: number};
}

@Component({
  selector: 'app-dashboard',
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, NgClass, CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  kpis: KPIData = {
    totalPL: 0,
    winRate: 0,
    expectancy: 0,
    maxGain: 0,
    maxLoss: 0,
    drawdown: 0,
    totalTrades: 0
  };
  
  trades: Trade[] = [];
  insights: string[] = [];
  heatmapData: HeatmapData | null = null;
  loading = false;
  error: string | null = null;

  // Filtros
  filters = {
    instrument: '',
    startDate: '',
    endDate: '',
    groupBy: 'instrument'
  };

  // Dados para gráficos (simulados por enquanto)
  equityData: any[] = [];
  dailyData: any[] = [];

  constructor(private tradeService: TradeService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    // Carregar KPIs
    this.loadKPIs();
    
    // Carregar trades
    this.loadTrades();
    
    // Carregar insights
    this.loadInsights();
    
    // Carregar heatmap
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
      },
      error: (error) => {
        console.error('Erro ao carregar KPIs', error);
        this.error = 'Erro ao carregar KPIs';
      }
    });
  }

  loadTrades() {
    const filter = {
      Instrument: this.filters.instrument || undefined,
      StartDate: this.filters.startDate ? new Date(this.filters.startDate) : undefined,
      EndDate: this.filters.endDate ? new Date(this.filters.endDate) : undefined,
      OrderBy: '-executedAtUTC',
      Limit: 50
    };

    this.tradeService.list(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.trades = response.results || [];
          this.generateChartData();
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
        },
        error: (error) => {
          console.error('Erro ao carregar heatmap', error);
        }
      });
  }

  applyFilters() {
    this.loadDashboardData();
  }

  clearFilters() {
    this.filters = {
      instrument: '',
      startDate: '',
      endDate: '',
      groupBy: 'instrument'
    };
    this.loadDashboardData();
  }

  private generateChartData() {
    // Gerar dados para gráfico de equity
    let cumulative = 0;
    this.equityData = this.trades
      .sort((a, b) => new Date(a.executedAtUTC!).getTime() - new Date(b.executedAtUTC!).getTime())
      .map(trade => {
        cumulative += trade.realizedPLEUR || 0;
        return {
          date: trade.executedAtUTC,
          equity: cumulative
        };
      });

    // Gerar dados para gráfico diário
    const dailyMap = new Map<string, number>();
    this.trades.forEach(trade => {
      const date = trade.executedAtUTC?.split('T')[0] || '';
      dailyMap.set(date, (dailyMap.get(date) || 0) + (trade.realizedPLEUR || 0));
    });

    this.dailyData = Array.from(dailyMap.entries()).map(([date, pl]) => ({
      date,
      pl
    }));
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
