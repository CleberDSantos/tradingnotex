import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TradeService } from '../services/trade.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe, CommonModule } from '@angular/common';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Trade, Comment } from '../services/trade.service';

// Declarar bibliotecas externas
declare var Chart: any;
declare var luxon: any;

interface PastedFile {
  file: File;
  preview: string;
  type: 'image' | 'file';
}

interface ChartData {
  labels: string[];
  prices: number[];
}

@Component({
  selector: 'app-trade-detail',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, DatePipe, CommonModule],
  templateUrl: './trade-detail.html',
  styleUrl: './trade-detail.scss'
})
export class TradeDetail implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('commentTextarea') commentTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileDropZone') fileDropZone!: ElementRef<HTMLDivElement>;
  @ViewChild('avChart') avChartCanvas!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();

  trade: Trade | null = null;
  comments: Comment[] = [];
  loading = false;
  error: string | null = null;

  // Controles do formulário
  entryTypeValue = 50;
  greedToggle = false;
  youtubeLink = '';
  newCommentText = '';
  showAITyping = false;

  // Campos de preços e níveis
  openPrice: number | null = null;
  execPrice: number | null = null;
  stopPrice: number | null = null;
  targetPrice: number | null = null;
  spread: number | null = null;
  otherFees: number | null = null;

  // Controles avançados de anexos
  pastedFiles: PastedFile[] = [];
  isDragOver = false;
  isUploading = false;
  modalImageSrc: string | null = null;

  // Gráfico
  stockChart: any = null;
  chartData: ChartData = { labels: [], prices: [] };
  chartLoading = false;
  chartError = '';

  // Abas
  activeTab = 'tab-entrada';

  // Alpha Vantage API Key (deve vir do environment)
  alphaVantageKey = 'MBQUDT2LF5EQF1WQ';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tradeService: TradeService
  ) {}

  ngOnInit() {
    const tradeId = this.route.snapshot.paramMap.get('id');
    if (tradeId) {
      this.loadTradeDetails(tradeId);
    }
  }

  ngAfterViewInit() {
    this.setupClipboardListeners();
    this.setupDragAndDrop();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.stockChart) {
      this.stockChart.destroy();
    }
  }

  private setupClipboardListeners() {
    document.addEventListener('paste', (e) => {
      if (this.isCommentAreaFocused()) {
        this.handlePaste(e);
      }
    });
  }

  private setupDragAndDrop() {
    if (!this.fileDropZone) return;

    const dropZone = this.fileDropZone.nativeElement;

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.isDragOver = true;
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.isDragOver = false;
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.isDragOver = false;
      this.handleDrop(e);
    });
  }

  private isCommentAreaFocused(): boolean {
    const activeElement = document.activeElement;
    return activeElement === this.commentTextarea?.nativeElement ||
           activeElement?.closest('.comment-input-area') !== null;
  }

  private async handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await this.addPastedFile(file);
        }
      }
    }
  }

  private async handleDrop(e: DragEvent) {
    const files = e.dataTransfer?.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        await this.addPastedFile(file);
      }
    }
  }

  private async addPastedFile(file: File): Promise<void> {
    try {
      const preview = await this.createFilePreview(file);
      const pastedFile: PastedFile = {
        file,
        preview,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      };

      this.pastedFiles.push(pastedFile);

      setTimeout(() => {
        this.commentTextarea?.nativeElement.focus();
      }, 100);

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      this.error = 'Erro ao processar arquivo';
    }
  }

  private createFilePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  removePastedFile(index: number) {
    this.pastedFiles.splice(index, 1);
  }

  async postComment() {
    if (!this.trade || (!this.newCommentText.trim() && this.pastedFiles.length === 0)) {
      return;
    }

    this.isUploading = true;

    try {
      const attachments = await Promise.all(
        this.pastedFiles.map(async (pastedFile) => ({
          type: pastedFile.type,
          data: pastedFile.preview,
          filename: pastedFile.file.name,
          size: pastedFile.file.size,
          mimeType: pastedFile.file.type
        }))
      );

      const comment = await lastValueFrom(this.tradeService.addComment(this.trade.objectId!, {
        text: this.newCommentText,
        attachments: attachments
      }));

      this.comments.unshift(comment);
      this.newCommentText = '';
      this.pastedFiles = [];

    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      this.error = 'Erro ao adicionar comentário';
    } finally {
      this.isUploading = false;
    }
  }

  canPaste(): boolean {
    return navigator.clipboard !== undefined;
  }

  getPlaceholderText(): string {
    if (this.canPaste()) {
      return 'Digite seu comentário ou cole uma imagem com Ctrl+V...';
    }
    return 'Digite seu comentário...';
  }

  openImageModal(imageSrc?: string | null) {
    if (!imageSrc) return;
    this.modalImageSrc = imageSrc;
  }

  closeImageModal() {
    this.modalImageSrc = null;
  }

  handleFileInput(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      this.addPastedFile(files[i]);
    }

    event.target.value = '';
  }

  loadTradeDetails(tradeId: string) {
    this.loading = true;
    this.tradeService.get(tradeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (trade) => {
          this.trade = trade;
          this.initializeFormValues();
          this.loadComments(tradeId);
          this.loadChartData();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erro ao carregar detalhes do trade';
          this.loading = false;
        }
      });
  }

  private initializeFormValues() {
    if (!this.trade) return;

    this.entryTypeValue = this.trade.entryType || 50;
    this.greedToggle = this.trade.greed || false;
    this.youtubeLink = this.trade.youtubeLink || '';

    // Preços e níveis
    this.openPrice = this.trade.openPrice || null;
    this.execPrice = this.trade.execPrice || null;
    this.stopPrice = this.trade.stopPrice || this.calculateInitialStop();
    this.targetPrice = this.trade.targetPrice || this.calculateInitialTarget();
    this.spread = this.trade.spread || null;
    this.otherFees = this.trade.otherFees || null;

    this.updateTradeStatus();
  }

  private calculateInitialStop(): number | null {
    if (!this.execPrice) return null;
    return this.execPrice * 0.985; // 1.5% abaixo
  }

  private calculateInitialTarget(): number | null {
    if (!this.execPrice) return null;
    return this.execPrice * 1.015; // 1.5% acima
  }

  loadComments(tradeId: string) {
    this.tradeService.listComments(tradeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comments) => {
          this.comments = comments;
        },
        error: (error) => {
          console.error('Erro ao carregar comentários', error);
        }
      });
  }

  async loadChartData() {
    if (!this.trade || !this.alphaVantageKey) {
      this.chartError = 'Configuração incompleta para carregar gráfico';
      this.renderChart([], []);
      return;
    }

    this.chartLoading = true;
    this.chartError = '';

    const symbol = this.trade.instrument || 'AAPL';
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(symbol)}&interval=15min&outputsize=full&apikey=${this.alphaVantageKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const timeSeriesKey = 'Time Series (15min)';

      if (!data[timeSeriesKey]) {
        this.chartError = data['Note'] || data['Error Message'] || 'Sem dados para o símbolo/intervalo.';
        this.renderChart([], []);
        return;
      }

      const rows = Object.entries(data[timeSeriesKey])
        .map(([time, values]: [string, any]) => ({
          time: new Date(time),
          close: parseFloat(values['4. close'])
        }))
        .sort((a, b) => a.time.getTime() - b.time.getTime());

      const execTime = new Date(this.trade.executedAtUTC);
      const start = new Date(execTime.getTime() - 24 * 60 * 60 * 1000);
      const end = new Date(execTime.getTime() + 24 * 60 * 60 * 1000);

      const filteredRows = rows.filter(r => r.time >= start && r.time <= end);

      const labels = filteredRows.map(r => this.formatDateTime(r.time));
      const prices = filteredRows.map(r => r.close);

      this.renderChart(labels, prices);
    } catch (error) {
      console.error('Erro ao obter dados do gráfico:', error);
      this.chartError = 'Erro ao obter dados.';
      this.renderChart([], []);
    } finally {
      this.chartLoading = false;
    }
  }

  private formatDateTime(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  }

  renderChart(labels: string[], prices: number[]) {
    if (!this.avChartCanvas) return;

    const ctx = this.avChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.stockChart) {
      this.stockChart.destroy();
    }

    const exec = this.execPrice || 0;
    const stop = this.stopPrice || exec;
    const target = this.targetPrice || exec;

    const makeHLine = (y: number, label: string, color: string) => ({
      type: 'line',
      label,
      data: labels.map(() => y),
      borderWidth: 1.5,
      borderDash: [6, 6],
      borderColor: color,
      backgroundColor: 'transparent',
      pointRadius: 0,
      fill: false
    });

    this.stockChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Preço',
            data: prices,
            borderWidth: 2,
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.1)',
            tension: 0.25,
            pointRadius: 0,
            fill: true
          },
          makeHLine(stop, 'Stop Loss', '#ef4444'),
          makeHLine(exec, 'Execução', '#f59e0b'),
          makeHLine(target, 'Alvo', '#10b981')
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#9ca3af' }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#9ca3af',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            },
            grid: { color: 'rgba(27,35,48,.3)' }
          },
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(27,35,48,.3)' }
          }
        }
      }
    });
  }

  onLevelsChange() {
    this.updateTradeStatus();
    this.saveTradeDetails();

    // Atualizar gráfico com novos níveis
    if (this.stockChart) {
      const labels = this.stockChart.data.labels;
      const prices = this.stockChart.data.datasets[0].data;
      this.renderChart(labels, prices);
    }
  }

  updateTradeStatus() {
    if (!this.trade) return;

    const exec = this.execPrice || 0;
    const target = this.targetPrice || 0;
    const pl = this.trade.realizedPLEUR || 0;

    let status = 'winner';
    if (exec > 0 && target > 0 && Math.abs(exec - target) < 0.01) {
      status = 'winner';
    } else if (exec < target && pl > 0) {
      status = 'protection';
    } else if (pl < 0) {
      status = 'loser';
    }

    this.trade.tradeStatus = status;
  }

  switchTab(tabId: string) {
    this.activeTab = tabId;
  }

  updateEntryType() {
    if (!this.trade) return;
    this.saveTradeDetails();
  }

  toggleGreed() {
    this.greedToggle = !this.greedToggle;
    this.saveTradeDetails();
  }

  saveTradeDetails() {
    if (!this.trade) return;

    const updateRequest = {
      openPrice: this.openPrice,
      execPrice: this.execPrice,
      stopPrice: this.stopPrice,
      targetPrice: this.targetPrice,
      spread: this.spread,
      otherFees: this.otherFees,
      entryType: this.entryTypeValue,
      greed: this.greedToggle,
      youtubeLink: this.youtubeLink,
      tradeStatus: this.trade.tradeStatus
    };

    this.tradeService.updateDetails(this.trade.objectId!, updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.trade = updated;
          // Mostrar feedback visual de salvamento
          this.showSaveSuccess();
        },
        error: (error) => {
          this.error = 'Erro ao salvar alterações';
        }
      });
  }

  private showSaveSuccess() {
    // Adicionar feedback visual temporário
    const saveBtn = document.querySelector('.save-button');
    if (saveBtn) {
      saveBtn.innerHTML = '✅ Salvo!';
      saveBtn.classList.add('bg-good/30');
      setTimeout(() => {
        saveBtn.innerHTML = '💾 Salvar Alterações';
        saveBtn.classList.remove('bg-good/30');
      }, 2000);
    }
  }

  requestAIAnalysis(commentId: string) {
    if (!this.trade) return;

    this.showAITyping = true;

    this.tradeService.analyzeComment(this.trade.objectId!, commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (analyzedComment) => {
          const index = this.comments.findIndex(c => c.id === commentId);
          if (index !== -1) {
            this.comments[index] = analyzedComment;
          }
          this.showAITyping = false;
        },
        error: (error) => {
          this.error = 'Erro na análise AI';
          this.showAITyping = false;
        }
      });
  }

  isCommentAnalyzed(comment: Comment): boolean {
    return !!comment.aiAnalysisRendered;
  }

  getEntryTypeLabel(): string {
    if (this.entryTypeValue < 30) return '🔥 Impulso Forte';
    if (this.entryTypeValue < 45) return '🔥 Mais Impulso';
    if (this.entryTypeValue < 55) return '⚖️ Balanceado';
    if (this.entryTypeValue < 70) return '⚙️ Mais Operacional';
    return '⚙️ Totalmente Operacional';
  }

  getEntryTypeClass(): string {
    if (this.entryTypeValue < 30) return 'bg-bad/20 text-bad';
    if (this.entryTypeValue < 45) return 'bg-accent/20 text-accent';
    if (this.entryTypeValue < 55) return 'bg-edge';
    if (this.entryTypeValue < 70) return 'bg-cyanx/20 text-cyanx';
    return 'bg-good/20 text-good';
  }

  getYouTubeVideoId(): string | null {
    if (!this.youtubeLink) return null;
    const match = this.youtubeLink.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }

  getStatusClass(): string {
    if (!this.trade) return '';

    switch (this.trade.tradeStatus) {
      case 'winner':
        return 'bg-gradient-to-r from-good/20 to-good/30 text-good';
      case 'loser':
        return 'bg-gradient-to-r from-bad/20 to-bad/30 text-bad';
      case 'protection':
        return 'bg-gradient-to-r from-accent/20 to-accent/30 text-accent';
      default:
        return 'bg-edge';
    }
  }

  getStatusIcon(): string {
    if (!this.trade) return '📊';

    switch (this.trade.tradeStatus) {
      case 'winner':
        return '🏆';
      case 'loser':
        return '📉';
      case 'protection':
        return '🛡️';
      default:
        return '📊';
    }
  }

  getStatusText(): string {
    if (!this.trade) return 'Analisando...';

    switch (this.trade.tradeStatus) {
      case 'winner':
        return 'Vencedor';
      case 'loser':
        return 'Perdedor';
      case 'protection':
        return 'Proteção';
      default:
        return 'Em análise';
    }
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
