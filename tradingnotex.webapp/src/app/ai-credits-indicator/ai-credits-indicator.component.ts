// ai-credits-indicator.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserManagementService } from '../services/user-management.service';
import { UserType, AI_CREDIT_COSTS } from '../models/user.model';

@Component({
  selector: 'app-ai-credits-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-credits-indicator.component.html',
  styles: [`
    .credits-indicator {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      background: linear-gradient(145deg, #1a1a2e 0%, #0f0f1e 100%);
      border: 1px solid #2a2a3e;
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      z-index: 40;
      min-width: 180px;
    }

    .credits-count {
      font-size: 1.25rem;
      font-weight: bold;
      color: #22d3ee;
    }

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

    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
  `]
})
export class AICreditsIndicatorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentCredits = 0;
  monthlyCredits = 10;
  showCreditsIndicator = false;
  showAIModal = false;

  // Toast
  showToast = false;
  toastIcon = '';
  toastTitle = '';
  toastMessage = '';

  // Tipo de usuário
  userType: UserType | null = null;

  constructor(
    private userManagementService: UserManagementService,
    private router: Router
  ) {}

  ngOnInit() {
    // Observar mudanças no usuário
    this.userManagementService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.userType = user.userType;
          this.showCreditsIndicator = user.userType === UserType.PREMIUM;

          if (user.userType === UserType.PREMIUM) {
            this.currentCredits = user.aiCredits || 0;
            this.monthlyCredits = 10;
          } else if (user.userType === UserType.OWNER) {
            this.currentCredits = -1; // Ilimitado
            this.showCreditsIndicator = false;
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCreditsColor(): string {
    if (this.currentCredits === -1) return '#10b981'; // Ilimitado

    const percentage = (this.currentCredits / this.monthlyCredits) * 100;
    if (percentage > 50) return '#10b981'; // Verde
    if (percentage > 20) return '#f59e0b'; // Laranja
    return '#ef4444'; // Vermelho
  }

  getCreditsColorClass(): string {
    if (this.currentCredits === -1) return 'text-good';

    const percentage = (this.currentCredits / this.monthlyCredits) * 100;
    if (percentage > 50) return 'text-good';
    if (percentage > 20) return 'text-accent';
    return 'text-bad';
  }

  getCreditsIcon(): string {
    if (this.currentCredits === -1) return '∞';

    const percentage = (this.currentCredits / this.monthlyCredits) * 100;
    if (percentage > 50) return '🔋';
    if (percentage > 20) return '🔋';
    return '🪫';
  }

  canUseFeature(feature: keyof typeof AI_CREDIT_COSTS): boolean {
    return this.userManagementService.canUseAI(feature);
  }

  useAI(action: keyof typeof AI_CREDIT_COSTS) {
    if (!this.canUseFeature(action)) {
      this.showToastMessage('❌', 'Créditos Insuficientes',
        `Você precisa de ${AI_CREDIT_COSTS[action]} créditos para esta análise.`);
      return;
    }

    // Fechar modal
    this.showAIModal = false;

    // Usar créditos
    this.userManagementService.useAICredits(action)
      .subscribe({
        next: (log) => {
          // Atualizar créditos localmente
          this.currentCredits -= AI_CREDIT_COSTS[action];

          // Mostrar sucesso
          this.showToastMessage('✅', 'Análise Iniciada',
            `${AI_CREDIT_COSTS[action]} crédito(s) consumido(s). Processando...`);

          // Emitir evento para o componente que solicitou
          this.processAIAnalysis(action);
        },
        error: (error) => {
          this.showToastMessage('❌', 'Erro',
            'Erro ao processar análise. Tente novamente.');
        }
      });
  }

  private processAIAnalysis(action: string) {
    // Aqui você pode emitir um evento ou chamar um serviço
    // para processar a análise de IA específica
    console.log(`Processando análise: ${action}`);

    // Simular processamento
    setTimeout(() => {
      this.showToastMessage('🤖', 'Análise Concluída',
        'Confira os resultados na seção de comentários.');
    }, 3000);
  }

  buyMoreCredits() {
    this.closeAIModal();
    this.router.navigate(['/buy-credits']);
  }

  viewUsageHistory() {
    this.closeAIModal();
    this.router.navigate(['/profile'], {
      queryParams: { tab: 'ai-usage' }
    });
  }

  openAIModal() {
    // Verificar se usuário pode usar IA
    const permissions = this.userManagementService.getCurrentPermissions();

    if (!permissions?.canUseAI) {
      if (this.userType === UserType.BASIC) {
        this.showToastMessage('🚀', 'Upgrade Necessário',
          'Faça upgrade para Premium para usar IA!');
        setTimeout(() => {
          this.router.navigate(['/upgrade']);
        }, 2000);
        return;
      }
    }

    this.showAIModal = true;
  }

  closeAIModal() {
    this.showAIModal = false;
  }

  private showToastMessage(icon: string, title: string, message: string) {
    this.toastIcon = icon;
    this.toastTitle = title;
    this.toastMessage = message;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }
}
