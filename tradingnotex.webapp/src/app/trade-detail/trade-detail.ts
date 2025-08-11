import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TradeService } from '../services/trade.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe, CommonModule } from '@angular/common';
import { Trade, Comment } from '../services/trade.service';

@Component({
  selector: 'app-trade-detail',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, DatePipe, CommonModule],
  templateUrl: './trade-detail.html',
  styleUrl: './trade-detail.scss'
})
export class TradeDetail implements OnInit {
  trade: Trade | null = null;
  comments: Comment[] = [];
  loading = false;
  error: string | null = null;

  // Controles do formulário
  entryTypeValue = 50;
  greedToggle = false;
  youtubeLink = '';
  newCommentText = '';
  currentScreenshot: string | null = null;
  showAITyping = false;

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

  postComment() {
    if (!this.trade || !this.newCommentText.trim()) return;

    this.tradeService.addComment(this.trade.objectId!, {
      text: this.newCommentText,
      screenshot: this.currentScreenshot || undefined
    }).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.newCommentText = '';
        this.currentScreenshot = null;
      },
      error: (error) => {
        this.error = 'Erro ao adicionar comentário';
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

  handleScreenshot(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.currentScreenshot = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeScreenshot() {
    this.currentScreenshot = null;
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
