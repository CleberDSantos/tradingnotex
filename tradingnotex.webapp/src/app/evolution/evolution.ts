import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { TradeService } from '../services/trade.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass, JsonPipe, CurrencyPipe, DecimalPipe, CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

declare var echarts: any;

interface EvolutionData {
  month: {
    current: { pl: number; trades: number; winRate: number };
    previous: { pl: number; trades: number; winRate: number };
    change: number;
  };
  week: {
    current: { pl: number; trades: number; winRate: number };
    previous: { pl: number; trades: number; winRate: number };
    change: number;
  };
  quarter: {
    progress: number;
    target: number;
    achieved: number;
  };
}

@Component({
  selector: 'app-evolution',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor, NgClass, JsonPipe, CurrencyPipe, DecimalPipe],
  templateUrl: './evolution.html',
  styleUrl: './evolution.scss'
})
export class EvolutionComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();


  private chartMonths: string[] = [];
  private chartEquity: number[] = [];
  private chartWinRate: number[] = [];
  private chartAvgTrades: number[] = [];
  // Dados de evolução
  evolutionData: EvolutionData = {
    month: {
      current: { pl: 0, trades: 0, winRate: 0 },
      previous: { pl: 0, trades: 0, winRate: 0 },
      change: 0
    },
    week: {
      current: { pl: 0, trades: 0, winRate: 0 },
      previous: { pl: 0, trades: 0, winRate: 0 },
      change: 0
    },
    quarter: {
      progress: 0,
      target: 100,
      achieved: 0
    }
  };

  // Gráfico
  private evolutionChart: any = null;

  // Estado
  loading = false;
  error: string | null = null;

  constructor(private tradeService: TradeService) {}

  ngOnInit() {
    this.loadEvolutionData();
  }

  ngAfterViewInit() {
    // Inicializar gráfico após a view estar pronta
    setTimeout(() => {
      this.initEvolutionChart();
      this.updateProgressRing();
    }, 500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.evolutionChart) {
      this.evolutionChart.dispose();
    }
  }

  private loadEvolutionData() {
    this.loading = true;

    // Carregar todos os trades para calcular evolução
    this.tradeService.list({ Limit: 1000, OrderBy: '-executedAtUTC' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const trades = response.results || [];
          this.calculateEvolution(trades);

          // NOVO: construir dados mensais reais p/ o gráfico
          this.buildMonthlyChartData(trades);

          this.updateUI();   // mantém badges, cards e ring
          this.loading = false;

           if (this.evolutionChart) {
              this.applyChartData();
            }
        },
        error: (error) => {
          console.error('Erro ao carregar dados de evolução:', error);
          this.error = 'Erro ao carregar dados de evolução';
          this.loading = false;
        }
      });
  }

  /** Retorna a data do primeiro dia do mês, 00:00:00 */
private monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/** Retorna a data do último dia do mês, 23:59:59.999 */
private monthEnd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Últimos 6 meses como pares {label, start, end} já ordenados do mais antigo para o mais recente */
private getLast6MonthsWindows() {
  const out: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const base = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = this.monthStart(base);
    const end = this.monthEnd(base);
    const monthName = base.toLocaleDateString('pt-BR', { month: 'short' });
    const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${String(base.getFullYear()).slice(-2)}`;
    out.push({ label, start, end });
  }
  return out;
}

/** Monta as séries reais para o gráfico */
private buildMonthlyChartData(trades: any[]) {
  const windows = this.getLast6MonthsWindows();

  const monthPL: number[] = [];
  const monthWinRate: number[] = [];
  const monthAvgTrades: number[] = [];

  for (const w of windows) {
    const monthTrades = trades.filter(t => {
      const dt = new Date(t.executedAtUTC);
      return dt >= w.start && dt <= w.end;
    });

    // PL do mês
    const pl = monthTrades.reduce((acc, t) => acc + (t.realizedPLEUR || 0), 0);

    // Win rate do mês
    const wins = monthTrades.filter(t => (t.realizedPLEUR || 0) > 0).length;
    const total = monthTrades.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    // Trades/dia (média por dia com operação naquele mês)
    const uniqueDays = new Set(
      monthTrades.map(t => new Date(t.executedAtUTC).toISOString().slice(0, 10)) // YYYY-MM-DD
    );
    const avgTrades = uniqueDays.size > 0 ? total / uniqueDays.size : 0;

    monthPL.push(Math.round(pl * 100) / 100);
    monthWinRate.push(Math.round(winRate * 10) / 10);
    monthAvgTrades.push(Math.round(avgTrades * 10) / 10);
  }

  // Equity como curva acumulada dos PL mensais
  const equity: number[] = [];
  let run = 0;
  for (const v of monthPL) {
    run += v;
    equity.push(Math.round(run * 100) / 100);
  }

  // Guardar nas propriedades usadas pelo chart
  this.chartMonths = windows.map(w => w.label);
  this.chartEquity = equity;
  this.chartWinRate = monthWinRate;
  this.chartAvgTrades = monthAvgTrades;
}


  private calculateEvolution(trades: any[]) {
    const now = new Date();

    // Calcular período do mês atual
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calcular período da semana atual
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfPreviousWeek = new Date(startOfWeek);
    startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);

    const endOfPreviousWeek = new Date(startOfWeek);
    endOfPreviousWeek.setMilliseconds(endOfPreviousWeek.getMilliseconds() - 1);

    // Filtrar trades por período
    const currentMonthTrades = trades.filter(t => {
      const date = new Date(t.executedAtUTC);
      return date >= startOfCurrentMonth && date <= now;
    });

    const previousMonthTrades = trades.filter(t => {
      const date = new Date(t.executedAtUTC);
      return date >= startOfPreviousMonth && date <= endOfPreviousMonth;
    });

    const currentWeekTrades = trades.filter(t => {
      const date = new Date(t.executedAtUTC);
      return date >= startOfWeek && date <= now;
    });

    const previousWeekTrades = trades.filter(t => {
      const date = new Date(t.executedAtUTC);
      return date >= startOfPreviousWeek && date < startOfWeek;
    });

    // Calcular métricas do mês
    this.evolutionData.month.current = this.calculateMetrics(currentMonthTrades);
    this.evolutionData.month.previous = this.calculateMetrics(previousMonthTrades);
    this.evolutionData.month.change = this.calculateChange(
      this.evolutionData.month.current.pl,
      this.evolutionData.month.previous.pl
    );

    // Calcular métricas da semana
    this.evolutionData.week.current = this.calculateMetrics(currentWeekTrades);
    this.evolutionData.week.previous = this.calculateMetrics(previousWeekTrades);
    this.evolutionData.week.change = this.calculateChange(
      this.evolutionData.week.current.pl,
      this.evolutionData.week.previous.pl
    );

    // Calcular progresso trimestral
    const startOfQuarter = this.getStartOfQuarter(now);
    const quarterTrades = trades.filter(t => {
      const date = new Date(t.executedAtUTC);
      return date >= startOfQuarter && date <= now;
    });

    const quarterMetrics = this.calculateMetrics(quarterTrades);
    this.evolutionData.quarter.achieved = quarterMetrics.pl;
    this.evolutionData.quarter.progress = (quarterMetrics.pl / this.evolutionData.quarter.target) * 100;
  }

  private calculateMetrics(trades: any[]): { pl: number; trades: number; winRate: number } {
    if (trades.length === 0) {
      return { pl: 0, trades: 0, winRate: 0 };
    }

    const pl = trades.reduce((sum, t) => sum + (t.realizedPLEUR || 0), 0);
    const wins = trades.filter(t => t.realizedPLEUR > 0).length;
    const winRate = (wins / trades.length) * 100;

    return {
      pl: Math.round(pl * 100) / 100,
      trades: trades.length,
      winRate: Math.round(winRate * 10) / 10
    };
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / Math.abs(previous)) * 100);
  }

  private getStartOfQuarter(date: Date): Date {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3, 1);
  }

  private updateUI() {
    // Atualizar badges
    this.updateBadge('evoMonthBadge', this.evolutionData.month.change);
    this.updateBadge('evoWeekBadge', this.evolutionData.week.change);

    // Atualizar cards de comparação
    this.updateComparisonCard('evoMonth', this.evolutionData.month);
    this.updateComparisonCard('evoWeek', this.evolutionData.week);

    // Atualizar anel de progresso
    this.updateProgressRing();

    // Atualizar gráfico
    this.updateEvolutionChart();
  }

  private updateBadge(elementId: string, change: number) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const isPositive = change >= 0;
    element.textContent = `${isPositive ? '+' : ''}${change}%`;
    element.className = `text-xs px-2 py-1 rounded ${
      isPositive ? 'bg-good/20 text-good' : 'bg-bad/20 text-bad'
    }`;
  }

  private updateComparisonCard(elementId: string, data: any) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const isPositive = data.change >= 0;
    const arrow = isPositive ? '↑' : '↓';
    const color = isPositive ? 'text-good' : 'text-bad';

    element.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-400">Atual</span>
        <span class="font-bold">€${data.current.pl.toFixed(2)}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-400">Anterior</span>
        <span>€${data.previous.pl.toFixed(2)}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-400">Trades</span>
        <span>${data.current.trades} vs ${data.previous.trades}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-400">Win Rate</span>
        <span>${data.current.winRate.toFixed(1)}% vs ${data.previous.winRate.toFixed(1)}%</span>
      </div>
      <div class="mt-2 pt-2 border-t border-edge">
        <div class="flex items-center justify-center gap-2 ${color}">
          <span class="text-lg">${arrow}</span>
          <span class="font-bold">${Math.abs(data.change)}%</span>
        </div>
      </div>
    `;
  }

private updateProgressRing() {
  const ring = document.querySelector<SVGCircleElement>('#evoRing');
  const pctElement = document.querySelector<HTMLElement>('#evoRingPct');
  if (!ring || !pctElement) return;

  const progress = Math.min(100, Math.max(0, this.evolutionData.quarter.progress));
  const circumference = 314; // 2πr (r=50)
  const offset = circumference - (progress / 100) * circumference;

  ring.style.strokeDashoffset = String(offset);
  ring.style.transition = 'stroke-dashoffset 1s ease-in-out';
  pctElement.textContent = `${Math.round(progress)}%`;

  if (progress >= 100) ring.style.stroke = '#10b981';
  else if (progress >= 75) ring.style.stroke = '#22d3ee';
  else if (progress >= 50) ring.style.stroke = '#f59e0b';
  else ring.style.stroke = '#ef4444';
}

 private initEvolutionChart() {
  const el = document.getElementById('evolutionChart');
  if (!el) return;

  this.evolutionChart = echarts.init(el, 'dark');

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 40, right: 60, bottom: 30, left: 50 },
    legend: {
      top: 5,
      textStyle: { color: '#9ca3af' }
    },
    xAxis: {
      type: 'category',
      data: [], // será preenchido
      axisLabel: { color: '#9ca3af' }
    },
    yAxis: [
      { type: 'value', name: '€', position: 'left', axisLabel: { color: '#9ca3af' } },
      { type: 'value', name: '%', position: 'right', axisLabel: { color: '#9ca3af' } }
    ],
    series: [
      { name: 'Equity', type: 'line', smooth: true, data: [], itemStyle: { color: '#10b981' }, areaStyle: { opacity: 0.1 } },
      { name: 'Win Rate', type: 'line', smooth: true, yAxisIndex: 1, data: [], itemStyle: { color: '#22d3ee' } },
      { name: 'Trades/Dia', type: 'bar', data: [], itemStyle: { color: '#f59e0b', opacity: 0.5 } }
    ],
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } }
  };

  this.evolutionChart.setOption(option);
  this.applyChartData(); // aplica imediatamente se já tiver dados
}

private applyChartData() {
  if (!this.evolutionChart) return;

  this.evolutionChart.setOption({
    xAxis: { data: this.chartMonths },
    series: [
      { name: 'Equity', data: this.chartEquity },
      { name: 'Win Rate', data: this.chartWinRate },
      { name: 'Trades/Dia', data: this.chartAvgTrades }
    ]
  });
}


 private updateEvolutionChart() {
  // Se quiser manter o método, apenas reaplica as séries atuais
  this.applyChartData();
}
}
