import { Component } from '@angular/core';
import { RiskService } from '../services/risk.service';
import { FormsModule } from '@angular/forms';
import { NgIf, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-risk',
  imports: [FormsModule, NgIf, JsonPipe],
  templateUrl: './risk.html',
  styleUrl: './risk.scss'
})
export class Risk {
  // Dados para avaliação de risco de dia
  dayRiskData = {
    day: '',
    goalEUR: 2.00,
    maxLossEUR: 2.00
  };

  // Dados para avaliação de risco de range
  rangeRiskData = {
    start: '',
    end: '',
    goalEUR: 2.00,
    maxLossEUR: 2.00
  };

  // Resultados
  dayRiskResult: any = null;
  rangeRiskResult: any = null;
  loading = false;
  error: string | null = null;

  constructor(private riskService: RiskService) {}

  evaluateDayRisk() {
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
}
