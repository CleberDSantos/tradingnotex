import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto p-6 space-y-6">
      <header class="animate-slide-up">
        <h1 class="text-2xl font-bold text-white">📊 Estatísticas do Sistema</h1>
        <p class="text-gray-400 text-sm mt-1">Monitore o desempenho e uso do sistema</p>
      </header>

      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
        <div class="card p-4 text-center">
          <div class="text-3xl font-bold text-cyanx">{{ stats.totalUsers }}</div>
          <div class="text-xs text-gray-400 mt-1">Total de Usuários</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-3xl font-bold text-good">{{ stats.activeUsers }}</div>
          <div class="text-xs text-gray-400 mt-1">Usuários Ativos</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-3xl font-bold text-accent">{{ stats.totalTrades }}</div>
          <div class="text-xs text-gray-400 mt-1">Total de Trades</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-3xl font-bold text-purple">{{ stats.aiCreditsUsed }}</div>
          <div class="text-xs text-gray-400 mt-1">Créditos IA Usados</div>
        </div>
      </section>

      <section class="card p-6 animate-slide-up">
        <h2 class="text-lg font-semibold mb-4">Uso por Tipo de Usuário</h2>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Basic</span>
            <div class="flex-1 mx-4 bg-edge rounded-full h-2">
              <div class="bg-gray-500 h-2 rounded-full" [style.width.%]="stats.basicPercentage"></div>
            </div>
            <span class="text-sm">{{ stats.basicCount }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Premium</span>
            <div class="flex-1 mx-4 bg-edge rounded-full h-2">
              <div class="bg-accent h-2 rounded-full" [style.width.%]="stats.premiumPercentage"></div>
            </div>
            <span class="text-sm">{{ stats.premiumCount }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Mentor</span>
            <div class="flex-1 mx-4 bg-edge rounded-full h-2">
              <div class="bg-purple h-2 rounded-full" [style.width.%]="stats.mentorPercentage"></div>
            </div>
            <span class="text-sm">{{ stats.mentorCount }}</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .card {
      background: linear-gradient(145deg, #1a1a2e 0%, #0f0f1e 100%);
      border: 1px solid #2a2a3e;
      border-radius: 12px;
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slide-up 0.3s ease-out forwards;
    }
  `]
})
export class SystemStatsComponent implements OnInit {
  stats = {
    totalUsers: 1234,
    activeUsers: 892,
    totalTrades: 45678,
    aiCreditsUsed: 3456,
    basicCount: 800,
    basicPercentage: 65,
    premiumCount: 400,
    premiumPercentage: 32,
    mentorCount: 34,
    mentorPercentage: 3
  };

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    // Em produção, isso viria de uma API
    console.log('Loading system stats...');
  }
}
