import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto p-6 space-y-6">
      <header class="animate-slide-up">
        <h1 class="text-2xl font-bold text-white">⚙️ Configurações do Sistema</h1>
        <p class="text-gray-400 text-sm mt-1">Configure parâmetros globais do sistema</p>
      </header>

      <section class="card p-6 animate-slide-up">
        <h2 class="text-lg font-semibold mb-4">Configurações de IA</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Créditos mensais para Premium</label>
            <input [(ngModel)]="settings.monthlyAICredits" type="number"
                   class="w-full bg-blacker border border-edge rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Custo por análise básica</label>
            <input [(ngModel)]="settings.basicAnalysisCost" type="number"
                   class="w-full bg-blacker border border-edge rounded-lg px-3 py-2">
          </div>
        </div>
      </section>

      <section class="card p-6 animate-slide-up">
        <h2 class="text-lg font-semibold mb-4">Limites de Usuários</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Máximo de trades/mês (Basic)</label>
            <input [(ngModel)]="settings.basicTradeLimit" type="number"
                   class="w-full bg-blacker border border-edge rounded-lg px-3 py-2">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Máximo de contas (Premium)</label>
            <input [(ngModel)]="settings.premiumAccountLimit" type="number"
                   class="w-full bg-blacker border border-edge rounded-lg px-3 py-2">
          </div>
        </div>
      </section>

      <div class="flex gap-3">
        <button (click)="saveSettings()"
                class="px-6 py-2 bg-gradient-to-r from-cyanx to-accent rounded-lg font-medium">
          💾 Salvar Configurações
        </button>
      </div>
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
export class SettingsComponent {
  settings = {
    monthlyAICredits: 10,
    basicAnalysisCost: 1,
    basicTradeLimit: 100,
    premiumAccountLimit: 5
  };

  saveSettings() {
    console.log('Saving settings:', this.settings);
  }
}
