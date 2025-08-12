import { Component } from '@angular/core';
import { PartialsService, PartialPlanRequest } from '../services/partials.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partials.html',
  styleUrls: ['./partials.scss']
})
export class Partials {
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
    usdPerPointPerContract: 2.0,
    targetCash: 180
  };

  optimizeData = {
    stopPts: 12,
    contracts: 2,
    targetR: 2.0,
    curvePreset: 'neutral'
  };

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

  exportPlan() {
    if (!this.planResult) return;

    const blob = new Blob([JSON.stringify(this.planResult, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plano_parciais_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}
