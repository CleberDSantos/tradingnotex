import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserManagementService } from '../../services/user-management.service';

@Component({
  selector: 'app-buy-credits',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto p-6 space-y-6">
      <header class="animate-slide-up">
        <h1 class="text-3xl font-bold text-white">💳 Comprar Créditos de IA</h1>
        <p class="text-gray-400 mt-2">Adicione mais créditos para continuar usando análises com IA</p>
      </header>

      <section class="card p-6 animate-slide-up">
        <div class="flex items-center justify-between mb-6">
          <div>
            <p class="text-sm text-gray-400">Saldo Atual</p>
            <p class="text-3xl font-bold text-cyanx">{{ currentCredits }} créditos</p>
          </div>
          <div class="text-6xl">🤖</div>
        </div>

        <div class="grid md:grid-cols-3 gap-4">
          <!-- Pacote Básico -->
          <div class="border border-edge rounded-lg p-4 hover:border-cyanx/50 transition-all cursor-pointer"
               (click)="selectPackage('basic')">
            <h3 class="font-bold text-lg mb-2">Pacote Básico</h3>
            <p class="text-2xl font-bold text-white mb-2">10 créditos</p>
            <p class="text-gray-400 text-sm mb-4">Ideal para uso ocasional</p>
            <p class="text-xl font-bold text-good">€4.99</p>
          </div>

          <!-- Pacote Popular -->
          <div class="border border-accent rounded-lg p-4 hover:border-accent/70 transition-all cursor-pointer relative"
               (click)="selectPackage('popular')">
            <span class="absolute -top-2 -right-2 bg-accent text-black text-xs px-2 py-1 rounded-full font-bold">
              Popular
            </span>
            <h3 class="font-bold text-lg mb-2">Pacote Plus</h3>
            <p class="text-2xl font-bold text-white mb-2">25 créditos</p>
            <p class="text-gray-400 text-sm mb-4">Melhor custo-benefício</p>
            <p class="text-xl font-bold text-accent">€9.99</p>
            <p class="text-xs text-gray-500">Economize 20%</p>
          </div>

          <!-- Pacote Pro -->
          <div class="border border-edge rounded-lg p-4 hover:border-purple/50 transition-all cursor-pointer"
               (click)="selectPackage('pro')">
            <h3 class="font-bold text-lg mb-2">Pacote Pro</h3>
            <p class="text-2xl font-bold text-white mb-2">60 créditos</p>
            <p class="text-gray-400 text-sm mb-4">Para uso intensivo</p>
            <p class="text-xl font-bold text-purple">€19.99</p>
            <p class="text-xs text-gray-500">Economize 30%</p>
          </div>
        </div>

        <div *ngIf="selectedPackage" class="mt-6 p-4 bg-edge rounded-lg">
          <p class="text-sm text-gray-400 mb-3">Pacote selecionado:</p>
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold">{{ getPackageName(selectedPackage) }}</p>
              <p class="text-sm text-gray-400">{{ getPackageCredits(selectedPackage) }} créditos</p>
            </div>
            <p class="text-2xl font-bold text-good">{{ getPackagePrice(selectedPackage) }}</p>
          </div>

          <button (click)="purchaseCredits()"
                  class="w-full mt-4 py-3 bg-gradient-to-r from-cyanx to-accent hover:from-accent hover:to-cyanx rounded-lg font-medium transition-all">
            🛒 Finalizar Compra
          </button>
        </div>
      </section>

      <section class="card p-6 animate-slide-up">
        <h2 class="text-lg font-semibold mb-4">📊 Tabela de Custos</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between py-2 border-b border-edge">
            <span class="text-gray-400">Análise de Trade</span>
            <span>1 crédito</span>
          </div>
          <div class="flex justify-between py-2 border-b border-edge">
            <span class="text-gray-400">Sugestões de Mercado</span>
            <span>2 créditos</span>
          </div>
          <div class="flex justify-between py-2 border-b border-edge">
            <span class="text-gray-400">Análise Avançada</span>
            <span>3 créditos</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-gray-400">Relatório Completo</span>
            <span>5 créditos</span>
          </div>
        </div>
      </section>

      <div class="text-center">
        <a routerLink="/dashboard" class="text-gray-400 hover:text-cyanx transition-colors">
          ← Voltar ao Dashboard
        </a>
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
export class BuyCreditsComponent implements OnInit {
  currentCredits = 0;
  selectedPackage: 'basic' | 'popular' | 'pro' | null = null;

  constructor(
    private userManagementService: UserManagementService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentCredits = this.userManagementService.getAICredits();
  }

  selectPackage(packageType: 'basic' | 'popular' | 'pro') {
    this.selectedPackage = packageType;
  }

  getPackageName(packageType: string): string {
    switch(packageType) {
      case 'basic': return 'Pacote Básico';
      case 'popular': return 'Pacote Plus';
      case 'pro': return 'Pacote Pro';
      default: return '';
    }
  }

  getPackageCredits(packageType: string): number {
    switch(packageType) {
      case 'basic': return 10;
      case 'popular': return 25;
      case 'pro': return 60;
      default: return 0;
    }
  }

  getPackagePrice(packageType: string): string {
    switch(packageType) {
      case 'basic': return '€4.99';
      case 'popular': return '€9.99';
      case 'pro': return '€19.99';
      default: return '';
    }
  }

  purchaseCredits() {
    if (!this.selectedPackage) return;

    const credits = this.getPackageCredits(this.selectedPackage);

    // Simular compra
    this.userManagementService.purchaseCredits(credits).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
