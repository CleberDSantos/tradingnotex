import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { RiskService } from '../services/risk.service';
import { TradeService } from '../services/trade.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass, JsonPipe, CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

declare var echarts: any;

@Component({
  selector: 'app-risk',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor, NgClass, JsonPipe, CurrencyPipe, DatePipe],
  templateUrl: './risk.html',
  styleUrl: './risk.scss'
})
export class RiskComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // Dados principais
  riskData = {
    goalEUR: 2.00,
    maxLossEUR: 2.00,
    selectedDay: '',
    impact: 0,
    greedDays: 0,
    lossDays: 0,
    compliantDays: 0
  };

  trades: any[] = [];

  // Dados de avaliação de risco
  dayRiskData = {
    day: '',
    goalEUR: 2.00,
    maxLossEUR: 2.00
  };

  rangeRiskData = {
    start: '',
    end: '',
    goalEUR: 2.00,
    maxLossEUR: 2.00
  };

  dayRiskResult: any = null;
  rangeRiskResult: any = null;
  loading = false;
  error: string | null = null;

  // Gráficos
  private charts: any = {
    dailyComparison: null,
    intraday: null
  };

  constructor(
    private riskService: RiskService,
    private tradeService: TradeService
  ) {
    // Definir data padrão como hoje
    const today = new Date();
    this.dayRiskData.day = today.toISOString().split('T')[0];
    this.riskData.selectedDay = this.dayRiskData.day;

    // Definir range padrão como última semana
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    this.rangeRiskData.end = endDate.toISOString().split('T')[0];
    this.rangeRiskData.start = startDate.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadInitialData();
  }

  ngAfterViewInit() {
    // Inicializar gráficos após a view estar pronta
    setTimeout(() => {
      this.initCharts();
    }, 500);
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

  private loadInitialData() {
    // Carregar trades para popular o select de dias
    this.loadTrades();

    // Avaliar risco do período padrão
    this.evaluateRangeRisk();
  }

  private loadTrades() {
    this.tradeService.list({ Limit: 100, OrderBy: '-executedAtUTC' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.trades = response.results || [];

          // Se temos trades, selecionar o dia do primeiro trade
          if (this.trades.length > 0) {
            const firstTradeDate = new Date(this.trades[0].executedAtUTC);
            this.riskData.selectedDay = firstTradeDate.toISOString().split('T')[0];
            this.dayRiskData.day = this.riskData.selectedDay;

            // Avaliar risco do dia selecionado
            this.evaluateDayRisk();
          }
        },
        error: (error) => {
          console.error('Erro ao carregar trades:', error);
        }
      });
  }

  private initCharts() {
    this.initDailyComparisonChart();
    this.initIntradayChart();
  }

  private initDailyComparisonChart() {
    const el = document.getElementById('chartDailyComparison');
    if (!el) return;

    this.charts.dailyComparison = echarts.init(el, 'dark');

    // Configuração inicial do gráfico
    const option = {
      backgroundColor: 'transparent',
      title: {
        text: 'Comparação: Real vs Disciplinado',
        left: 10,
        top: 10,
        textStyle: { color: '#e5e7eb', fontSize: 14 }
      },
      legend: {
        data: ['P/L Real', 'P/L Disciplinado'],
        top: 10,
        right: 10,
        textStyle: { color: '#9ca3af' }
      },
      grid: {
        top: 50,
        right: 30,
        bottom: 40,
        left: 60
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLabel: { color: '#9ca3af' }
      },
      yAxis: {
        type: 'value',
        name: 'P/L (€)',
        axisLabel: { color: '#9ca3af' }
      },
      series: [
        {
          name: 'P/L Real',
          type: 'bar',
          data: [],
          itemStyle: { color: '#ef4444' }
        },
        {
          name: 'P/L Disciplinado',
          type: 'bar',
          data: [],
          itemStyle: { color: '#10b981' }
        }
      ]
    };

    this.charts.dailyComparison.setOption(option);
  }

  private initIntradayChart() {
    const el = document.getElementById('chartIntraday');
    if (!el) return;

    this.charts.intraday = echarts.init(el, 'dark');

    const option = {
      backgroundColor: 'transparent',
      title: {
        text: 'Evolução Intraday',
        left: 10,
        top: 10,
        textStyle: { color: '#e5e7eb', fontSize: 14 }
      },
      grid: {
        top: 50,
        right: 30,
        bottom: 40,
        left: 60
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>P/L: €${data.value}`;
        }
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLabel: {
          color: '#9ca3af',
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'P/L Acumulado (€)',
        axisLabel: { color: '#9ca3af' }
      },
      series: [
        {
          type: 'line',
          data: [],
          smooth: true,
          areaStyle: { opacity: 0.3 },
          itemStyle: { color: '#22d3ee' },
          markLine: {
            data: [
              {
                yAxis: this.riskData.goalEUR,
                name: 'Meta',
                label: { formatter: 'Meta: €{c}' },
                lineStyle: { color: '#10b981', type: 'dashed' }
              },
              {
                yAxis: -this.riskData.maxLossEUR,
                name: 'Loss',
                label: { formatter: 'Loss: €{c}' },
                lineStyle: { color: '#ef4444', type: 'dashed' }
              }
            ]
          }
        }
      ]
    };

    this.charts.intraday.setOption(option);
  }

  evaluateDayRisk() {
    if (!this.dayRiskData.day && !this.riskData.selectedDay) {
      this.error = 'Por favor, selecione uma data';
      return;
    }

    const dayToEvaluate = this.riskData.selectedDay || this.dayRiskData.day;

    this.loading = true;
    this.error = null;

    this.riskService.evaluateRiskDay(
      dayToEvaluate,
      this.riskData.goalEUR,
      this.riskData.maxLossEUR
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.dayRiskResult = response;
        this.updateIntradayChart(response);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao avaliar risco do dia', error);
        this.error = 'Falha ao avaliar risco do dia.';
        this.loading = false;
      }
    });
  }

  evaluateRangeRisk() {
    if (!this.rangeRiskData.start || !this.rangeRiskData.end) {
      this.error = 'Por favor, selecione as datas de início e fim';
      return;
    }

    this.loading = true;
    this.error = null;

    this.riskService.evaluateRiskRange(
      this.rangeRiskData.start,
      this.rangeRiskData.end,
      this.riskData.goalEUR,
      this.riskData.maxLossEUR
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.rangeRiskResult = response;
        this.updateRiskMetrics(response);
        this.updateDailyComparisonChart(response);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao avaliar risco do range', error);
        this.error = 'Falha ao avaliar risco do período.';
        this.loading = false;
      }
    });
  }

  private updateRiskMetrics(rangeResult: any) {
    if (!rangeResult || !rangeResult.results) return;

    const results = rangeResult.results;

    // Calcular métricas
    let greedDays = 0;
    let lossDays = 0;
    let compliantDays = 0;
    let totalImpact = 0;

    results.forEach((dayResult: any) => {
      if (dayResult.greed) greedDays++;
      if (dayResult.lossBreach) lossDays++;
      if (!dayResult.greed && !dayResult.lossBreach) compliantDays++;
      totalImpact += dayResult.impact || 0;
    });

    // Atualizar dados
    this.riskData.greedDays = greedDays;
    this.riskData.lossDays = lossDays;
    this.riskData.compliantDays = compliantDays;
    this.riskData.impact = totalImpact;
  }

  private updateDailyComparisonChart(rangeResult: any) {
    if (!this.charts.dailyComparison || !rangeResult || !rangeResult.results) return;

    const days: string[] = [];
    const realPL: number[] = [];
    const disciplinedPL: number[] = [];

    rangeResult.results.forEach((dayResult: any) => {
      const date = new Date(dayResult.day);
      days.push(date.toLocaleDateString('pt-BR'));
      realPL.push(dayResult.final || 0);
      disciplinedPL.push(dayResult.disciplined || 0);
    });

    this.charts.dailyComparison.setOption({
      xAxis: { data: days },
      series: [
        { data: realPL },
        { data: disciplinedPL }
      ]
    });
  }

  private updateIntradayChart(dayResult: any) {
    if (!this.charts.intraday || !dayResult || !dayResult.curve) return;

    const times: string[] = [];
    const values: number[] = [];

    dayResult.curve.forEach((point: any) => {
      times.push(point.time);
      values.push(point.equity);
    });

    this.charts.intraday.setOption({
      xAxis: { data: times },
      series: [{
        data: values,
        markLine: {
          data: [
            {
              yAxis: this.riskData.goalEUR,
              name: 'Meta',
              label: { formatter: 'Meta: €{c}' },
              lineStyle: { color: '#10b981', type: 'dashed' }
            },
            {
              yAxis: -this.riskData.maxLossEUR,
              name: 'Loss',
              label: { formatter: 'Loss: €{c}' },
              lineStyle: { color: '#ef4444', type: 'dashed' }
            }
          ]
        }
      }]
    });

    // Adicionar marcadores se atingiu meta ou loss
    if (dayResult.hitGoalAt) {
      console.log('Meta atingida às:', dayResult.hitGoalAt);
    }
    if (dayResult.hitLossAt) {
      console.log('Loss atingido às:', dayResult.hitLossAt);
    }
  }

  applyFilters() {
    // Atualizar avaliações com os novos filtros
    if (this.riskData.selectedDay) {
      this.dayRiskData.day = this.riskData.selectedDay;
      this.evaluateDayRisk();
    }

    // Sempre avaliar o range
    this.evaluateRangeRisk();
  }

  clearFilters() {
    // Resetar dados
    this.riskData = {
      goalEUR: 2.00,
      maxLossEUR: 2.00,
      selectedDay: '',
      impact: 0,
      greedDays: 0,
      lossDays: 0,
      compliantDays: 0
    };

    const today = new Date();
    this.dayRiskData = {
      day: today.toISOString().split('T')[0],
      goalEUR: 2.00,
      maxLossEUR: 2.00
    };

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    this.rangeRiskData = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      goalEUR: 2.00,
      maxLossEUR: 2.00
    };

    this.dayRiskResult = null;
    this.rangeRiskResult = null;

    // Limpar gráficos
    if (this.charts.dailyComparison) {
      this.charts.dailyComparison.clear();
      this.initDailyComparisonChart();
    }
    if (this.charts.intraday) {
      this.charts.intraday.clear();
      this.initIntradayChart();
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-PT');
  }
}
