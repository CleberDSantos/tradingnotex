import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';

declare var echarts: any;

@Component({
  selector: 'app-chart',
  imports: [NgIf],
  template: `
    <div class="chart-container">
      <div #chartContainer [style.height]="height" [style.width]="width"></div>
      <div *ngIf="loading" class="chart-loading">
        <div class="loading-spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
    }
    
    .chart-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 19, 26, 0.8);
    }
    
    .loading-spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid #1b2330;
      border-top: 2px solid #22d3ee;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class Chart implements OnInit, OnDestroy {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() options: any = {};
  @Input() height: string = '400px';
  @Input() width: string = '100%';
  @Input() loading: boolean = false;
  @Input() theme: string = 'dark';

  private chart: any;

  ngOnInit() {
    this.initChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
  }

  private initChart() {
    if (typeof echarts === 'undefined') {
      console.warn('ECharts library not loaded');
      return;
    }

    this.chart = echarts.init(this.chartContainer.nativeElement, this.theme);
    
    if (this.options) {
      this.updateChart();
    }

    // Responsivo
    window.addEventListener('resize', () => {
      if (this.chart) {
        this.chart.resize();
      }
    });
  }

  updateChart() {
    if (this.chart && this.options) {
      this.chart.setOption(this.options, true);
    }
  }

  // Método público para atualizar as opções
  setOption(options: any) {
    this.options = options;
    this.updateChart();
  }
}
