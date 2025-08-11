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

  ngOnInit() 

echo "✅ Migração concluída com sucesso!"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "==================="
echo "1. Inicie o backend:"
echo "   cd tradingnotex/tradingnotex.api"
echo "   dotnet run"
echo ""
echo "2. Inicie o frontend:"
echo "   cd tradingnotex.webapp"
echo "   npm start"
echo ""
echo "3. Acesse a aplicação:"
echo "   Frontend: http://localhost:4200"
echo "   Backend API: https://localhost:44368"
echo "   Swagger: https://localhost:44368/swagger"
echo ""
echo "4. Credenciais de teste:"
echo "   Username: demo"
echo "   Password: demo123"
echo ""
echo "🔍 PRINCIPAIS MUDANÇAS:"
echo "======================="
echo "✅ Dashboard agora carrega dados da API"
echo "✅ JavaScript extraído para componentes Angular"
echo "✅ Navegação dinâmica implementada"
echo "✅ Login funcional com autenticação"
echo "✅ Filtros e KPIs dinâmicos"
echo "✅ Estrutura de componentes organizada"
echo "✅ Estilos modernos com Tailwind CSS"
echo ""
echo "📋 FUNCIONALIDADES IMPLEMENTADAS:"
echo "================================="
echo "• Login/Logout com autenticação JWT"
echo "• Dashboard com KPIs em tempo real"
echo "• Lista de trades dinâmica"
echo "• Filtros por instrumento e data"
echo "• Insights gerados pela API"
echo "• Heatmap de horários"
echo "• Navegação protegida por guards"
echo "• Responsive design"
