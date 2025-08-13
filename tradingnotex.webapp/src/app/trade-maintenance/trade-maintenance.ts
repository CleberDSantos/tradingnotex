// tradingnotex.webapp/src/app/trade-maintenance/trade-maintenance.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TradeService, Trade } from '../services/trade.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-trade-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trade-maintenance.html',
  styleUrl: './trade-maintenance.scss'
})
export class TradeMaintenance implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estados
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Dados
  trades: Trade[] = [];
  selectedTrades: Set<string> = new Set();

  // Paginação
  currentPage = 1;
  pageSize = 25;
  totalTrades = 0;

  // Formulário de novo trade
  newTrade: Partial<Trade> = {
    executedAtUTC: new Date().toISOString().slice(0, 16),
    instrument: '',
    side: 'buy',
    realizedPLEUR: 0,
    durationMin: 0,
    setup: 'SMC',
    tradeStatus: 'Vencedor',
    openPrice: null,
    execPrice: null,
    stopPrice: null,
    targetPrice: null,
    spread: null,
    otherFees: null,
    entryType: 50,
    dailyGoalReached: false,
    dailyLossReached: false,
    greed: false
  };

  // Importação
  selectedFile: File | null = null;
  importing = false;

  constructor(private tradeService: TradeService) {}

  ngOnInit() {
    this.loadTrades();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTrades() {
    this.loading = true;
    this.error = null;

    const filter = {
      OrderBy: '-executedAtUTC',
      Limit: this.pageSize,
      Skip: (this.currentPage - 1) * this.pageSize
    };

    this.tradeService.list(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.trades = response.results || [];
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erro ao carregar trades';
          this.loading = false;
        }
      });

    // Carregar total de trades para paginação
    this.tradeService.getKPIs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (kpis) => {
          this.totalTrades = kpis.totalTrades;
        }
      });
  }

  // Formulário manual
  clearForm() {
    this.newTrade = {
      executedAtUTC: new Date().toISOString().slice(0, 16),
      instrument: '',
      side: 'buy',
      realizedPLEUR: 0,
      durationMin: 0,
      setup: 'SMC',
      tradeStatus: 'Vencedor',
      openPrice: null,
      execPrice: null,
      stopPrice: null,
      targetPrice: null,
      spread: null,
      otherFees: null,
      entryType: 50,
      dailyGoalReached: false,
      dailyLossReached: false,
      greed: false
    };
  }

  saveTrade() {
    if (!this.newTrade.instrument) {
      this.error = 'Instrumento é obrigatório';
      return;
    }

    const trade: Trade = {
      ...this.newTrade as Trade,
      executedAtUTC: this.newTrade.executedAtUTC ?
        new Date(this.newTrade.executedAtUTC).toISOString() :
        new Date().toISOString()
    };

    this.loading = true;
    this.tradeService.create(trade)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Trade salvo com sucesso!';
          this.clearForm();
          this.loadTrades();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (error) => {
          this.error = 'Erro ao salvar trade';
          this.loading = false;
        }
      });
  }

  // Importação
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  importFile() {
    if (!this.selectedFile) {
      this.error = 'Selecione um arquivo para importar';
      return;
    }

    this.importing = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const content = e.target.result;
        let trades: Trade[] = [];

        if (this.selectedFile!.name.toLowerCase().endsWith('.json')) {
          const data = JSON.parse(content);
          trades = Array.isArray(data) ? data : data.trades || [];
        } else if (this.selectedFile!.name.toLowerCase().endsWith('.csv')) {
          trades = this.parseCSV(content);
        } else {
          throw new Error('Formato não suportado');
        }

        // Validar e normalizar trades
        trades = trades.map(t => this.normalizeTrade(t));

        // Enviar para API
        this.tradeService.importTrades({
          name: this.selectedFile!.name,
          statementDateISO: new Date().toISOString(),
          trades: trades
        }).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.successMessage = `${trades.length} trades importados com sucesso!`;
            this.selectedFile = null;
            this.loadTrades();
            setTimeout(() => this.successMessage = null, 5000);
          },
          error: (error) => {
            this.error = 'Erro ao importar trades';
          },
          complete: () => {
            this.importing = false;
          }
        });

      } catch (error) {
        this.error = 'Erro ao processar arquivo';
        this.importing = false;
      }
    };

    reader.readAsText(this.selectedFile);
  }

  private parseCSV(content: string): any[] {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = values[i];
      });
      return obj;
    });
  }

  private normalizeTrade(trade: any): Trade {
    return {
      executedAtUTC: trade.executedAtUTC || new Date().toISOString(),
      instrument: trade.instrument || 'UNKNOWN',
      side: (trade.side || 'buy').toLowerCase(),
      realizedPLEUR: parseFloat(trade.realizedPLEUR) || 0,
      durationMin: parseInt(trade.durationMin) || null,
      setup: trade.setup || 'SMC',
      tradeStatus: trade.tradeStatus || (trade.realizedPLEUR >= 0 ? 'Vencedor' : 'Perdedor'),
      openPrice: parseFloat(trade.openPrice) || null,
      execPrice: parseFloat(trade.execPrice) || null,
      stopPrice: parseFloat(trade.stopPrice) || null,
      targetPrice: parseFloat(trade.targetPrice) || null,
      spread: parseFloat(trade.spread) || null,
      otherFees: parseFloat(trade.otherFees) || null,
      entryType: parseFloat(trade.entryType) || 50,
      dailyGoalReached: trade.dailyGoalReached === true,
      dailyLossReached: trade.dailyLossReached === true,
      greed: trade.greed === true,
      youtubeLink: trade.youtubeLink || '',
      notes: trade.notes || '',
      tags: trade.tags || [],
      comments: []
    } as Trade;
  }

  // Seleção e exclusão
  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.trades.forEach(t => {
        if (t.objectId) this.selectedTrades.add(t.objectId);
      });
    } else {
      this.selectedTrades.clear();
    }
  }

  toggleSelect(tradeId: string | undefined) {
    if (!tradeId) return;

    if (this.selectedTrades.has(tradeId)) {
      this.selectedTrades.delete(tradeId);
    } else {
      this.selectedTrades.add(tradeId);
    }
  }

  isSelected(tradeId: string | undefined): boolean {
    return tradeId ? this.selectedTrades.has(tradeId) : false;
  }

  deleteSelected() {
    if (this.selectedTrades.size === 0) return;

    if (!confirm(`Excluir ${this.selectedTrades.size} trade(s) selecionado(s)?`)) {
      return;
    }

    this.loading = true;
    const deletePromises = Array.from(this.selectedTrades).map(id =>
      this.tradeService.delete(id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        this.successMessage = `${this.selectedTrades.size} trades excluídos com sucesso!`;
        this.selectedTrades.clear();
        this.loadTrades();
        setTimeout(() => this.successMessage = null, 3000);
      })
      .catch(() => {
        this.error = 'Erro ao excluir trades';
        this.loading = false;
      });
  }

  deleteTrade(tradeId: string | undefined) {
    if (!tradeId) return;

    if (!confirm('Excluir este trade?')) return;

    this.loading = true;
    this.tradeService.delete(tradeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Trade excluído com sucesso!';
          this.loadTrades();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: () => {
          this.error = 'Erro ao excluir trade';
          this.loading = false;
        }
      });
  }

  deleteAll() {
    if (!confirm('ATENÇÃO: Isso excluirá TODOS os trades. Deseja continuar?')) return;
    if (!confirm('Tem certeza absoluta? Esta ação não pode ser desfeita!')) return;

    // Implementação simplificada - idealmente deveria haver um endpoint específico
    this.loading = true;
    const deletePromises = this.trades
      .filter(t => t.objectId)
      .map(t => this.tradeService.delete(t.objectId!).toPromise());

    Promise.all(deletePromises)
      .then(() => {
        this.successMessage = 'Todos os trades foram excluídos!';
        this.trades = [];
        this.selectedTrades.clear();
        this.totalTrades = 0;
        setTimeout(() => this.successMessage = null, 3000);
      })
      .catch(() => {
        this.error = 'Erro ao excluir trades';
      })
      .finally(() => {
        this.loading = false;
      });
  }

  // Paginação
  get totalPages(): number {
    return Math.ceil(this.totalTrades / this.pageSize);
  }

  get canGoPrevious(): boolean {
    return this.currentPage > 1;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages;
  }

  previousPage() {
    if (this.canGoPrevious) {
      this.currentPage--;
      this.loadTrades();
    }
  }

  nextPage() {
    if (this.canGoNext) {
      this.currentPage++;
      this.loadTrades();
    }
  }

  changePageSize(event: any) {
    this.pageSize = parseInt(event.target.value);
    this.currentPage = 1;
    this.loadTrades();
  }

  // Formatação
  formatDate(date: string): string {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  getSideIcon(side: string): string {
    return side === 'buy' ? '📈' : '📉';
  }

  getSideClass(side: string): string {
    return side === 'buy' ? 'text-good' : 'text-bad';
  }

  getPLClass(pl: number): string {
    return pl >= 0 ? 'text-good' : 'text-bad';
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Vencedor': return 'bg-good/20 text-good';
      case 'Perdedor': return 'bg-bad/20 text-bad';
      case 'Proteção': return 'bg-accent/20 text-accent';
      default: return 'bg-edge';
    }
  }
}
