import { Component } from '@angular/core';
import { PartialsService, PartialPlanRequest } from '../services/partials.service';
import { FormsModule } from '@angular/forms';
import { NgIf, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-partials',
  imports: [FormsModule, NgIf, JsonPipe],
  templateUrl: './partials.html',
  styleUrl: './partials.scss'
})
export class Partials {
  // Dados para geração do plano de parciais
  partialPlanData: PartialPlanRequest = {
    stopPts: 12,
    contracts: 2,
    direction: 'long',
    entry: 20000,
    r1: 1.0,
    r2: 1.5,
    r3: 2.0,
    p1: 50,
    p2: 30,
    p3: 20,
    usdPerPointPerContract: 2.0
  };

  // Dados para otimização de parciais
  optimizeData = {
    stopPts: 12,
    contracts: 2,
    targetR: 2.0,
    curvePreset: ''
  };

  // Resultados
  planResult: any = null;
  optimizeResult: any = null;
  loading = false;
  error: string | null = null;

  constructor(private partialsService: PartialsService) {}

  generatePartialPlan() {
    this.loading = true;
    this.error = null;
    this.planResult = null;

    this.partialsService.generatePartialPlan(this.partialPlanData).subscribe({
      next: (response) => {
        this.planResult = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao gerar plano de parciais', error);
        this.error = 'Falha ao gerar plano de parciais.';
        this.loading = false;
      }
    });
  }

  optimizePartials() {
    this.loading = true;
    this.error = null;
    this.optimizeResult = null;

    this.partialsService.optimizePartials(this.optimizeData).subscribe({
      next: (response) => {
        this.optimizeResult = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao otimizar parciais', error);
        this.error = 'Falha ao otimizar parciais.';
        this.loading = false;
      }
    });
  }
}
