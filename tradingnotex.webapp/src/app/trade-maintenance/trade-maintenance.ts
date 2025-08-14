// tradingnotex.webapp/src/app/trade-maintenance/trade-maintenance.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TradeService, Trade, ImportTradesPayload } from '../services/trade.service';
import { Subject, takeUntil } from 'rxjs';
import { Account, AccountService } from '../services/account.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trade-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trade-maintenance.html',
  styleUrl: './trade-maintenance.scss'
})
export class TradeMaintenance implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  importing = false;
  trades: any[] = [];
  accounts: Account[] = [];
  selectedTrades: any[] = [];
  allSelected = false;

  showImportModal = false;
  showEditModal = false;
  editingTrade: any = {};
  importError = '';

  filters = {
    accountId: '',
    instrument: '',
    startDate: '',
    endDate: ''
  };

  stats = {
    total: 0,
    wins: 0,
    losses: 0,
    accounts: 0,
    totalPL: 0
  };

  importData = {
    accountId: '',
    name: '',
    fileName: '',
    trades: [] as Trade[],
    preview: [] as Trade[],
    tradesCount: 0
  };

  constructor(
    private tradeService: TradeService,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAccounts();
    this.loadTrades();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAccounts() {
    this.accountService.list()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.accounts = response.results || [];
          this.stats.accounts = this.accounts.length;
        }
      });
  }

  loadTrades() {
    this.loading = true;
    const filter: any = {
      OrderBy: '-executedAtUTC',
      Limit: 100
    };

    if (this.filters.accountId) {
      filter.AccountId = this.filters.accountId;
    }

    if (this.filters.instrument) {
      filter.Instrument = this.filters.instrument;
    }

    if (this.filters.startDate) {
      filter.StartDate = new Date(this.filters.startDate);
    }

    if (this.filters.endDate) {
      filter.EndDate = new Date(this.filters.endDate);
    }

    this.tradeService.list(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.trades = response.results || [];
          this.updateStats();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  loadMoreTrades() {
    // Implementar paginação
  }

  updateStats() {
    this.stats.total = this.trades.length;
    this.stats.wins = this.trades.filter(t => t.realizedPLEUR > 0).length;
    this.stats.losses = this.trades.filter(t => t.realizedPLEUR < 0).length;
    this.stats.totalPL = this.trades.reduce((sum, t) => sum + (t.realizedPLEUR || 0), 0);
  }

  applyFilters() {
    this.loadTrades();
  }

  clearFilters() {
    this.filters = {
      accountId: '',
      instrument: '',
      startDate: '',
      endDate: ''
    };
    this.loadTrades();
  }

  openImportModal() {
    this.showImportModal = true;
    this.resetImportData();
  }

  closeImportModal() {
    this.showImportModal = false;
    this.resetImportData();
  }

  resetImportData() {
    this.importData = {
      accountId: '',
      name: '',
      fileName: '',
      trades: [],
      preview: [],
      tradesCount: 0
    };
    this.importError = '';
  }

  handleFileInput(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.importData.fileName = file.name;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;

      if (file.name.endsWith('.json')) {
        this.parseJsonFile(text);
      } else if (file.name.endsWith('.csv')) {
        this.parseCsvFile(text);
      }
    };
    reader.readAsText(file);
  }

  parseJsonFile(text: string) {
    try {
      const json = JSON.parse(text);
      let trades: Trade[] = [];

      if (json && Array.isArray(json.trades)) {
        trades = json.trades;
      } else if (Array.isArray(json)) {
        trades = json;
      }

      this.importData.trades = trades;
      this.importData.tradesCount = trades.length;
      this.importData.preview = trades.slice(0, 5);
    } catch (error) {
      this.importError = 'Erro ao processar arquivo JSON';
    }
  }

  parseCsvFile(text: string) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      this.importError = 'Arquivo CSV vazio ou inválido';
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const trades: Trade[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const trade: any = {};

      headers.forEach((header, index) => {
        trade[header] = values[index];
      });

      // Converter campos numéricos
      if (trade.realizedPLEUR) {
        trade.realizedPLEUR = parseFloat(trade.realizedPLEUR);
      }
      if (trade.durationMin) {
        trade.durationMin = parseInt(trade.durationMin);
      }

      trades.push(trade);
    }

    this.importData.trades = trades;
    this.importData.tradesCount = trades.length;
    this.importData.preview = trades.slice(0, 5);
  }

  confirmImport() {
    if (!this.importData.accountId) {
      this.importError = 'Por favor, selecione uma conta';
      return;
    }

    if (this.importData.trades.length === 0) {
      this.importError = 'Nenhum trade para importar';
      return;
    }

    this.importing = true;
    this.importError = '';

    const payload: ImportTradesPayload = {
      name: this.importData.name || this.importData.fileName,
      accountId: this.importData.accountId,
      trades: this.importData.trades
    };

    this.tradeService.importTrades(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.importing = false;
          this.closeImportModal();
          this.loadTrades();
        },
        error: (error) => {
          this.importing = false;
          this.importError = 'Erro ao importar trades. Verifique o formato do arquivo.';
        }
      });
  }

  toggleSelectAll(event: any) {
    this.allSelected = event.target.checked;
    this.trades.forEach(t => t.selected = this.allSelected);
    this.updateSelection();
  }

  updateSelection() {
    this.selectedTrades = this.trades.filter(t => t.selected);
  }

  deleteSelected() {
    if (confirm(`Excluir ${this.selectedTrades.length} trades selecionados?`)) {
      // Implementar exclusão em lote
    }
  }

  editTrade(trade: any) {
    this.editingTrade = { ...trade };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingTrade = {};
  }

  saveEdit() {
    if (this.editingTrade.objectId) {
      this.tradeService.update(this.editingTrade.objectId, this.editingTrade)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeEditModal();
            this.loadTrades();
          }
        });
    }
  }

  viewDetails(trade: any) {
    this.router.navigate(['/trade', trade.objectId]);
  }

  deleteTrade(trade: any) {
    if (confirm(`Excluir trade de ${trade.instrument}?`)) {
      this.tradeService.delete(trade.objectId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.loadTrades()
        });
    }
  }

  exportTrades() {
    const data = JSON.stringify(this.trades, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getAccountName(accountId: string | undefined): string {
    if (!accountId) return '';
    const account = this.accounts.find(a => a.objectId === accountId);
    return account ? account.name : '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }
}
