import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 space-y-6">
      <!-- Header -->
      <header class="animate-slide-up">
        <h1 class="text-2xl font-bold text-white">👤 Meu Perfil</h1>
        <p class="text-gray-400 text-sm mt-1">Gerencie suas informações pessoais e preferências</p>
      </header>

      <!-- Informações Básicas -->
      <section class="card p-6 animate-slide-up" style="animation-delay: .1s">
        <h2 class="text-lg font-semibold mb-4">Informações Básicas</h2>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Nome de Usuário</label>
            <input
              [(ngModel)]="profile.username"
              type="text"
              disabled
              class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 opacity-60">
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">E-mail</label>
            <input
              [(ngModel)]="profile.email"
              type="email"
              class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Nome Completo</label>
            <input
              [(ngModel)]="profile.fullName"
              type="text"
              class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Telefone</label>
            <input
              [(ngModel)]="profile.phone"
              type="tel"
              class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
          </div>
        </div>

        <div class="mt-6">
          <button
            (click)="saveProfile()"
            class="px-6 py-2 bg-gradient-to-r from-cyanx to-accent hover:from-accent hover:to-cyanx rounded-lg font-medium transition-all">
            💾 Salvar Alterações
          </button>
        </div>
      </section>

      <!-- Preferências de Trading -->
      <section class="card p-6 animate-slide-up" style="animation-delay: .2s">
        <h2 class="text-lg font-semibold mb-4">Preferências de Trading</h2>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Meta Diária (€)</label>
            <input
              [(ngModel)]="preferences.dailyGoal"
              type="number"
              step="0.01"
              class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Loss Máximo (€)</label>
            <input
              [(ngModel)]="preferences.maxLoss"
              type="number"
              step="0.01"
              class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Horário Preferido</label>
            <select
              [(ngModel)]="preferences.preferredSession"
              class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
              <option value="asian">Sessão Asiática</option>
              <option value="london">Sessão de Londres</option>
              <option value="ny">Sessão de Nova York</option>
              <option value="all">Todas as Sessões</option>
            </select>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Estratégia Principal</label>
            <select
              [(ngModel)]="preferences.mainStrategy"
              class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
              <option value="smc">SMC</option>
              <option value="ict">ICT</option>
              <option value="priceaction">Price Action</option>
              <option value="scalping">Scalping</option>
              <option value="swing">Swing Trading</option>
              <option value="other">Outra</option>
            </select>
          </div>
        </div>

        <div class="mt-4">
          <label class="flex items-center gap-2">
            <input
              [(ngModel)]="preferences.enableNotifications"
              type="checkbox"
              class="rounded border-edge">
            <span class="text-sm text-gray-400">Receber notificações de análise</span>
          </label>
        </div>

        <div class="mt-6">
          <button
            (click)="savePreferences()"
            class="px-6 py-2 bg-gradient-to-r from-cyanx to-accent hover:from-accent hover:to-cyanx rounded-lg font-medium transition-all">
            💾 Salvar Preferências
          </button>
        </div>
      </section>

      <!-- Segurança -->
      <section class="card p-6 animate-slide-up" style="animation-delay: .3s">
        <h2 class="text-lg font-semibold mb-4">Segurança</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Senha Atual</label>
            <input
              [(ngModel)]="security.currentPassword"
              type="password"
              class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Nova Senha</label>
              <input
                [(ngModel)]="security.newPassword"
                type="password"
                class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
            </div>

            <div>
              <label class="block text-sm text-gray-400 mb-1">Confirmar Nova Senha</label>
              <input
                [(ngModel)]="security.confirmPassword"
                type="password"
                class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
            </div>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            (click)="changePassword()"
            class="px-6 py-2 bg-gradient-to-r from-cyanx to-accent hover:from-accent hover:to-cyanx rounded-lg font-medium transition-all">
            🔐 Alterar Senha
          </button>
        </div>
      </section>

      <!-- Estatísticas da Conta -->
      <section class="card p-6 animate-slide-up" style="animation-delay: .4s">
        <h2 class="text-lg font-semibold mb-4">Estatísticas da Conta</h2>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-cyanx">{{ stats.totalTrades }}</div>
            <div class="text-xs text-gray-400 mt-1">Total de Trades</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-good">{{ stats.accountAge }}</div>
            <div class="text-xs text-gray-400 mt-1">Dias de Conta</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-accent">{{ stats.totalAccounts }}</div>
            <div class="text-xs text-gray-400 mt-1">Contas Cadastradas</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-cyanx">{{ stats.lastLogin }}</div>
            <div class="text-xs text-gray-400 mt-1">Último Login</div>
          </div>
        </div>
      </section>

      <!-- Zona de Perigo -->
      <section class="card p-6 border-bad/30 animate-slide-up" style="animation-delay: .5s">
        <h2 class="text-lg font-semibold mb-4 text-bad">⚠️ Zona de Perigo</h2>

        <div class="space-y-4">
          <div class="p-4 bg-bad/10 border border-bad/30 rounded-lg">
            <h3 class="font-semibold text-bad mb-2">Excluir Conta</h3>
            <p class="text-sm text-gray-400 mb-3">
              Uma vez excluída, não será possível recuperar sua conta e todos os dados serão permanentemente removidos.
            </p>
            <button
              (click)="confirmDeleteAccount()"
              class="px-4 py-2 bg-bad hover:bg-red-700 rounded-lg font-medium transition-all">
              🗑️ Excluir Minha Conta
            </button>
          </div>
        </div>
      </section>

      <!-- Modal de Confirmação -->
      <div *ngIf="showDeleteModal"
           class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
           (click)="showDeleteModal = false">
        <div class="bg-card border border-edge rounded-xl p-6 w-full max-w-md animate-slide-up"
             (click)="$event.stopPropagation()">
          <h2 class="text-xl font-semibold mb-4 text-bad">⚠️ Confirmar Exclusão de Conta</h2>
          <p class="text-gray-400 mb-4">
            Esta ação é <strong class="text-white">IRREVERSÍVEL</strong>.
            Todos os seus dados, trades, análises e configurações serão permanentemente excluídos.
          </p>
          <p class="text-gray-400 mb-6">
            Digite <strong class="text-white">EXCLUIR</strong> para confirmar:
          </p>
          <input
            [(ngModel)]="deleteConfirmation"
            type="text"
            placeholder="Digite EXCLUIR"
            class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 mb-4 focus:border-bad focus:outline-none">
          <div class="flex gap-3">
            <button
              (click)="deleteAccount()"
              [disabled]="deleteConfirmation !== 'EXCLUIR'"
              class="flex-1 px-4 py-2 bg-bad hover:bg-red-700 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Excluir Permanentemente
            </button>
            <button
              (click)="showDeleteModal = false"
              class="px-4 py-2 bg-edge hover:bg-card rounded-lg font-medium transition-all">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-slide-up {
      animation: slide-up 0.3s ease-out forwards;
    }

    .animate-fade-in {
      animation: fade-in 0.2s ease-out;
    }

    .card {
      background: linear-gradient(145deg, #1a1a2e 0%, #0f0f1e 100%);
      border: 1px solid #2a2a3e;
      border-radius: 12px;
    }
  `]
})
export class ProfileComponent implements OnInit {
  showDeleteModal = false;
  deleteConfirmation = '';

  profile = {
    username: localStorage.getItem('username') || 'usuário',
    email: '',
    fullName: '',
    phone: ''
  };

  preferences = {
    dailyGoal: 2.00,
    maxLoss: 2.00,
    preferredSession: 'london',
    mainStrategy: 'smc',
    enableNotifications: true
  };

  security = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  stats = {
    totalTrades: 247,
    accountAge: 45,
    totalAccounts: 3,
    lastLogin: 'Hoje'
  };

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    // Carregar dados do perfil do localStorage ou API
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      this.profile = { ...this.profile, ...JSON.parse(savedProfile) };
    }

    const savedPreferences = localStorage.getItem('tradingPreferences');
    if (savedPreferences) {
      this.preferences = { ...this.preferences, ...JSON.parse(savedPreferences) };
    }
  }

  saveProfile() {
    localStorage.setItem('userProfile', JSON.stringify(this.profile));
    console.log('Perfil salvo:', this.profile);
  }

  savePreferences() {
    localStorage.setItem('tradingPreferences', JSON.stringify(this.preferences));
    console.log('Preferências salvas:', this.preferences);
  }

  changePassword() {
    if (this.security.newPassword !== this.security.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    if (this.security.newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres!');
      return;
    }

    console.log('Alterando senha...');
    this.security = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  confirmDeleteAccount() {
    this.showDeleteModal = true;
    this.deleteConfirmation = '';
  }

  deleteAccount() {
    if (this.deleteConfirmation === 'EXCLUIR') {
      console.log('Excluindo conta...');
      // Implementar exclusão real via API
      localStorage.clear();
      window.location.href = '/login';
    }
  }
}
