import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TradeService } from '../services/trade.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe, CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { Trade, Comment } from '../services/trade.service';

interface PastedFile {
  file: File;
  preview: string;
  type: 'image' | 'file';
}

@Component({
  selector: 'app-trade-detail',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, DatePipe, CommonModule],
  templateUrl: './trade-detail.html',
  styleUrl: './trade-detail.scss'
})
export class TradeDetail implements OnInit, AfterViewInit {
  @ViewChild('commentTextarea') commentTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileDropZone') fileDropZone!: ElementRef<HTMLDivElement>;

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

  // Controles avançados de anexos
  pastedFiles: PastedFile[] = [];
  isDragOver = false;
  isUploading = false;
  modalImageSrc: string | null = null;

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

  private setupClipboardListeners() {
    document.addEventListener('paste', (e) => {
      if (this.isCommentAreaFocused()) {
        this.handlePaste(e);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'v' && this.isCommentAreaFocused()) {
        // O evento paste será disparado automaticamente
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

  // Métodos existentes mantidos...
  loadTradeDetails(tradeId: string) {
    this.loading = true;
    this.tradeService.get(tradeId).subscribe({
      next: (trade) => {
        this.trade = trade;
        this.entryTypeValue = trade.entryType || 50;
        this.greedToggle = trade.greed || false;
        this.youtubeLink = trade.youtubeLink || '';
        this.loadComments(tradeId);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erro ao carregar detalhes do trade';
        this.loading = false;
      }
    });
  }

  loadComments(tradeId: string) {
    this.tradeService.listComments(tradeId).subscribe({
      next: (comments) => {
        this.comments = comments;
      },
      error: (error) => {
        console.error('Erro ao carregar comentários', error);
      }
    });
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

    this.tradeService.updateDetails(this.trade.objectId!, {
      entryType: this.entryTypeValue,
      greed: this.greedToggle,
      youtubeLink: this.youtubeLink
    }).subscribe({
      next: (updated) => {
        this.trade = updated;
      },
      error: (error) => {
        this.error = 'Erro ao salvar alterações';
      }
    });
  }

  requestAIAnalysis(commentId: string) {
    if (!this.trade) return;

    this.showAITyping = true;

    this.tradeService.analyzeComment(this.trade.objectId!, commentId).subscribe({
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

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
