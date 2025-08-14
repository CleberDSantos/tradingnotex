import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService, Account } from '../services/account.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto p-6 space-y-6">
      <!-- Header -->
      <header class="flex justify-between items-center animate-slide-up">
        <div>
          <h1 class="text-2xl font-bold text-white">💼 Gerenciar Contas</h1>
          <p class="text-gray-400 text-sm mt-1">Gerencie suas contas de trading</p>
        </div>
        <button
          (click)="openModal()"
          class="px-4 py-2 bg-gradient-to-r from-cyanx to-accent hover:from-accent hover:to-cyanx rounded-lg font-medium transition-all transform hover:scale-105">
          ➕ Nova Conta
        </button>
      </header>

      <!-- Filtros e Ordenação -->
      <section class="flex flex-wrap gap-4 items-center justify-between animate-slide-up" style="animation-delay: .05s">
        <div class="flex flex-wrap gap-3">
          <!-- Filtro por Tipo -->
          <select
            [(ngModel)]="filters.accountType"
            (ngModelChange)="loadAccounts()"
            class="bg-blacker border border-edge rounded-lg px-3 py-2 text-sm focus:border-cyanx focus:outline-none">
            <option value="">Todos os tipos</option>
            <option value="real">Real</option>
            <option value="demo">Demo</option>
            <option value="prop">Prop Firm</option>
          </select>

          <!-- Filtro por Status -->
          <select
            [(ngModel)]="filters.isActive"
            (ngModelChange)="loadAccounts()"
            class="bg-blacker border border-edge rounded-lg px-3 py-2 text-sm focus:border-cyanx focus:outline-none">
            <option value="">Todos os status</option>
            <option value="true">Ativas</option>
            <option value="false">Inativas</option>
          </select>

          <!-- Filtro por Moeda -->
          <select
            [(ngModel)]="filters.currency"
            (ngModelChange)="loadAccounts()"
            class="bg-blacker border border-edge rounded-lg px-3 py-2 text-sm focus:border-cyanx focus:outline-none">
            <option value="">Todas as moedas</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="BRL">BRL</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <div class="flex items-center gap-3">
          <!-- Ordenação -->
          <select
            [(ngModel)]="orderBy"
            (ngModelChange)="loadAccounts()"
            class="bg-blacker border border-edge rounded-lg px-3 py-2 text-sm focus:border-cyanx focus:outline-none">
            <option value="-createdAt">Mais recentes</option>
            <option value="createdAt">Mais antigas</option>
            <option value="name">Nome (A-Z)</option>
            <option value="-name">Nome (Z-A)</option>
            <option value="-balance">Maior saldo</option>
            <option value="balance">Menor saldo</option>
            <option value="-isActive">Ativas primeiro</option>
          </select>

          <!-- Limite de resultados -->
          <select
            [(ngModel)]="limit"
            (ngModelChange)="loadAccounts()"
            class="bg-blacker border border-edge rounded-lg px-3 py-2 text-sm focus:border-cyanx focus:outline-none">
            <option value="25">25 contas</option>
            <option value="50">50 contas</option>
            <option value="100">100 contas</option>
            <option value="0">Todas</option>
          </select>
        </div>
      </section>

      <!-- Informações -->
      <div class="flex items-center justify-between text-sm text-gray-400 animate-slide-up" style="animation-delay: .1s">
        <span>{{ accounts.length }} conta(s) encontrada(s)</span>
        <span *ngIf="loading">Carregando...</span>
      </div>

      <!-- Lista de Contas -->
      <section class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up" style="animation-delay: .15s">
        <div *ngFor="let account of accounts"
             class="card p-6 hover:border-cyanx/50 transition-all group">
          <!-- Header do Card -->
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                {{ account.name }}
                <span *ngIf="account.accountType === 'prop'"
                      class="text-xs px-2 py-1 bg-accent/20 text-accent rounded-full">
                  PROP
                </span>
                <span *ngIf="account.accountType === 'demo'"
                      class="text-xs px-2 py-1 bg-gray-600/20 text-gray-400 rounded-full">
                  DEMO
                </span>
                <span *ngIf="account.accountType === 'real'"
                      class="text-xs px-2 py-1 bg-good/20 text-good rounded-full">
                  REAL
                </span>
              </h3>
              <p class="text-sm text-gray-400 mt-1">{{ account.broker || 'Sem corretora' }}</p>
            </div>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                (click)="editAccount(account)"
                class="p-2 hover:bg-cyanx/20 rounded-lg transition-colors"
                title="Editar">
                ✏️
              </button>
              <button
                (click)="confirmDelete(account)"
                class="p-2 hover:bg-bad/20 rounded-lg transition-colors"
                title="Excluir">
                🗑️
              </button>
            </div>
          </div>

          <!-- Informações -->
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Moeda:</span>
              <span class="font-medium">{{ account.currency || 'EUR' }}</span>
            </div>
            <div class="flex justify-between" *ngIf="account.balance !== undefined">
              <span class="text-gray-400">Saldo:</span>
              <span class="font-medium" [ngClass]="account.balance >= 0 ? 'text-good' : 'text-bad'">
                {{ formatCurrency(account.balance, account.currency || 'EUR') }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Status:</span>
              <span class="font-medium" [ngClass]="account.isActive ? 'text-good' : 'text-gray-500'">
                {{ account.isActive ? '✅ Ativa' : '⏸️ Inativa' }}
              </span>
            </div>
            <div class="flex justify-between" *ngIf="account.createdAt">
              <span class="text-gray-400">Criada:</span>
              <span class="font-medium text-xs">{{ formatDate(account.createdAt) }}</span>
            </div>
          </div>

          <!-- Notas -->
          <div *ngIf="account.notes" class="mt-4 pt-4 border-t border-edge">
            <p class="text-xs text-gray-400">{{ account.notes }}</p>
          </div>
        </div>

        <!-- Card Vazio -->
        <div *ngIf="accounts.length === 0 && !loading"
             class="col-span-full card p-12 text-center">
          <div class="text-6xl mb-4">💼</div>
          <h3 class="text-xl font-semibold text-white mb-2">Nenhuma conta encontrada</h3>
          <p class="text-gray-400 mb-6">
            {{ hasFilters() ? 'Tente ajustar os filtros ou' : '' }}
            Adicione sua primeira conta para começar a organizar seus trades
          </p>
          <button
            (click)="openModal()"
            class="px-6 py-3 bg-gradient-to-r from-cyanx to-accent hover:from-accent hover:to-cyanx rounded-lg font-medium transition-all">
            ➕ {{ hasFilters() ? 'Nova Conta' : 'Adicionar Primeira Conta' }}
          </button>
        </div>
      </section>

                <!-- Modal de Formulário -->
      <div *ngIf="showModal"
           class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
           (click)="closeModal()">
        <div class="bg-card border border-edge rounded-xl p-6 w-full max-w-md animate-slide-up"
             (click)="$event.stopPropagation()">
          <h2 class="text-xl font-semibold mb-4">
            {{ editingAccount ? '✏️ Editar Conta' : '➕ Nova Conta' }}
          </h2>

          <form (ngSubmit)="saveAccount()" class="space-y-4">
            <!-- Nome -->
            <div>
              <label class="block text-sm text-gray-400 mb-1">Nome da Conta *</label>
              <input
                [(ngModel)]="formData.name"
                name="name"
                type="text"
                required
                placeholder="Ex: Conta Principal"
                class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
            </div>

            <!-- Corretora -->
            <div>
              <label class="block text-sm text-gray-400 mb-1">Corretora</label>
              <input
                [(ngModel)]="formData.broker"
                name="broker"
                type="text"
                placeholder="Ex: MFF, Bulenox, Trading 212"
                class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
            </div>

            <!-- Tipo de Conta -->
            <div>
              <label class="block text-sm text-gray-400 mb-1">Tipo de Conta</label>
              <select
                [(ngModel)]="formData.accountType"
                name="accountType"
                class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
                <option value="real">Real</option>
                <option value="demo">Demo</option>
                <option value="prop">Prop Firm</option>
              </select>
            </div>

            <!-- Moeda -->
            <div>
              <label class="block text-sm text-gray-400 mb-1">Moeda</label>
              <select
                [(ngModel)]="formData.currency"
                name="currency"
                class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - Dólar</option>
                <option value="BRL">BRL - Real</option>
                <option value="GBP">GBP - Libra</option>
              </select>
            </div>

            <!-- Saldo Inicial -->
            <div>
              <label class="block text-sm text-gray-400 mb-1">Saldo Inicial</label>
              <input
                [(ngModel)]="formData.balance"
                name="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none">
            </div>

            <!-- Status -->
            <div class="flex items-center gap-2">
              <input
                [(ngModel)]="formData.isActive"
                name="isActive"
                type="checkbox"
                id="isActive"
                class="rounded border-edge">
              <label for="isActive" class="text-sm text-gray-400">Conta ativa</label>
            </div>

            <!-- Notas -->
            <div>
              <label class="block text-sm text-gray-400 mb-1">Notas</label>
              <textarea
                [(ngModel)]="formData.notes"
                name="notes"
                rows="3"
                placeholder="Observações sobre esta conta..."
                class="w-full bg-blacker border border-edge rounded-lg px-3 py-2 focus:border-cyanx focus:outline-none resize-none">
              </textarea>
            </div>

            <!-- Botões -->
            <div class="flex gap-3 pt-4">
              <button
                type="submit"
                [disabled]="!formData.name || saving"
                class="flex-1 px-4 py-2 bg-gradient-to-r from-cyanx to-accent hover:from-accent hover:to-cyanx rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {{ saving ? 'Salvando...' : (editingAccount ? 'Atualizar' : 'Criar Conta') }}
              </button>
              <button
                type="button"
                (click)="closeModal()"
                class="px-4 py-2 bg-edge hover:bg-card rounded-lg font-medium transition-all">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Confirmação de Exclusão -->
      <div *ngIf="showDeleteModal"
           class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
           (click)="showDeleteModal = false">
        <div class="bg-card border border-edge rounded-xl p-6 w-full max-w-sm animate-slide-up"
             (click)="$event.stopPropagation()">
          <h2 class="text-xl font-semibold mb-4 text-bad">⚠️ Confirmar Exclusão</h2>
          <p class="text-gray-400 mb-6">
            Tem certeza que deseja excluir a conta <strong class="text-white">{{ accountToDelete?.name }}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div class="flex gap-3">
            <button
              (click)="deleteAccount()"
              class="flex-1 px-4 py-2 bg-bad hover:bg-red-700 rounded-lg font-medium transition-all">
              Excluir
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
      transition: all 0.3s ease;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(34, 211, 238, 0.1);
    }
  `]
})
export class AccountsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  accounts: Account[] = [];
  loading = false;
  showModal = false;
  showDeleteModal = false;
  editingAccount: Account | null = null;
  accountToDelete: Account | null = null;
  saving = false;

  // Filtros e ordenação
  filters = {
    accountType: '',
    isActive: '',
    currency: '',
    broker: ''
  };
  orderBy = '-createdAt';
  limit = 25;

  formData: Account = {
    name: '',
    broker: '',
    accountType: 'real',
    currency: 'EUR',
    balance: 0,
    isActive: true,
    notes: ''
  };

  constructor(private accountService: AccountService) {}

  ngOnInit() {
    this.loadAccounts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAccounts() {
    this.loading = true;

    const params: any = {
      OrderBy: this.orderBy
    };

    // Aplicar limite apenas se não for "Todas"
    if (this.limit > 0) {
      params.Limit = this.limit;
    }

    // Aplicar filtros apenas se selecionados
    if (this.filters.accountType) {
      params.AccountType = this.filters.accountType;
    }

    if (this.filters.isActive !== '') {
      params.IsActive = this.filters.isActive === 'true';
    }

    if (this.filters.currency) {
      params.Currency = this.filters.currency;
    }

    if (this.filters.broker) {
      params.Broker = this.filters.broker;
    }

    this.accountService.list(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.accounts = response.results || [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar contas:', error);
          this.loading = false;
        }
      });
  }

  openModal() {
    this.showModal = true;
    this.editingAccount = null;
    this.resetForm();
  }

  closeModal() {
    this.showModal = false;
    this.editingAccount = null;
    this.resetForm();
  }

  editAccount(account: Account) {
    this.editingAccount = account;
    this.formData = { ...account };
    this.showModal = true;
  }

  confirmDelete(account: Account) {
    this.accountToDelete = account;
    this.showDeleteModal = true;
  }

  saveAccount() {
    if (!this.formData.name) return;

    this.saving = true;

    const operation = this.editingAccount
      ? this.accountService.update(this.editingAccount.objectId!, this.formData)
      : this.accountService.create(this.formData);

    operation.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAccounts();
          this.closeModal();
          this.saving = false;
        },
        error: (error) => {
          console.error('Erro ao salvar conta:', error);
          this.saving = false;
        }
      });
  }

  deleteAccount() {
    if (!this.accountToDelete?.objectId) return;

    this.accountService.delete(this.accountToDelete.objectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadAccounts();
          this.showDeleteModal = false;
          this.accountToDelete = null;
        },
        error: (error) => {
          console.error('Erro ao excluir conta:', error);
        }
      });
  }

  resetForm() {
    this.formData = {
      name: '',
      broker: '',
      accountType: 'real',
      currency: 'EUR',
      balance: 0,
      isActive: true,
      notes: ''
    };
  }

  hasFilters(): boolean {
    return !!(this.filters.accountType || this.filters.isActive || this.filters.currency || this.filters.broker);
  }

  formatCurrency(value: number, currency: string): string {
    const formatter = new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency
    });
    return formatter.format(value);
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
}
