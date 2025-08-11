import { Component } from '@angular/core';
import { RiskService } from '../services/risk.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-risk',
  imports: [FormsModule, NgIf, NgFor, NgClass, JsonPipe],
  templateUrl: './risk.html',
  styleUrl: './risk.scss'
})
export class Risk {
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

  constructor(private riskService: RiskService) {
    // Definir data padrão como hoje
    this.dayRiskData.day = new Date().toISOString().split('T')[0];

    // Definir range padrão como última semana
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    this.rangeRiskData.end = endDate.toISOString().split('T')[0];
    this.rangeRiskData.start = startDate.toISOString().split('T')[0];
  }

  evaluateDayRisk() {
    if (!this.dayRiskData.day) {
      this.error = 'Por favor, selecione uma data';
      return;
    }

    this.loading = true;
    this.error = null;
    this.dayRiskResult = null;

    this.riskService.evaluateRiskDay(
      this.dayRiskData.day,
      this.dayRiskData.goalEUR,
      this.dayRiskData.maxLossEUR
    ).subscribe({
      next: (response) => {
        this.dayRiskResult = response;
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
    this.rangeRiskResult = null;

    this.riskService.evaluateRiskRange(
      this.rangeRiskData.start,
      this.rangeRiskData.end,
      this.rangeRiskData.goalEUR,
      this.rangeRiskData.maxLossEUR
    ).subscribe({
      next: (response) => {
        this.rangeRiskResult = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao avaliar risco do range', error);
        this.error = 'Falha ao avaliar risco do range.';
        this.loading = false;
      }
    });
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

  // Métodos para calcular estatísticas de risco
  getGreedDaysCount(): number {
    if (!this.rangeRiskResult?.results) return 0;
    return this.rangeRiskResult.results.filter((r: any) => r.greed).length;
  }

  getLossBreachDaysCount(): number {
    if (!this.rangeRiskResult?.results) return 0;
    return this.rangeRiskResult.results.filter((r: any) => r.lossBreach).length;
  }

  getDisciplinedDaysCount(): number {
    if (!this.rangeRiskResult?.results) return 0;
    return this.rangeRiskResult.results.filter((r: any) => !r.greed && !r.lossBreach).length;
  }
}
