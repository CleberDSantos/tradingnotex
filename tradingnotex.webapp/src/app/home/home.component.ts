import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

type BillingCycle = 'monthly' | 'yearly';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  // tudo em um único arquivo: template + estilos inline
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-[#0a0c10] to-[#0f131a] text-gray-100 mt-20"
    >
      <!-- NAV -->
     <nav
  [ngClass]="isScrolled ? 'bg-[#0a0c10]/95 backdrop-blur-md border-b border-[#1b2330]' : 'bg-transparent'"
  class="fixed top-0 w-full z-50 transition-all duration-300"
  role="navigation"
  aria-label="Primário"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style="margin: unset;">
    <div class="flex h-16 items-center">
      <!-- LOGO (sempre à esquerda) -->
      <div class="shrink-0">
        <button (click)="scrollToSection('top')"
                class="inline-flex items-center h-10 leading-none"
                aria-label="Ir para o início">
          <span class="text-2xl font-bold bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] bg-clip-text text-transparent">
            TradingNoteX
          </span>
        </button>
      </div>

      <!-- MENU DESKTOP (direita) -->
      <div class="ml-auto hidden md:flex items-center gap-6">
        <button (click)="scrollToSection('features')"
                class="inline-flex items-center h-10 px-2 leading-none text-gray-400 hover:text-white transition">
          Recursos
        </button>
        <button (click)="scrollToSection('pricing')"
                class="inline-flex items-center h-10 px-2 leading-none text-gray-400 hover:text-white transition">
          Preços
        </button>
        <button (click)="scrollToSection('testimonials')"
                class="inline-flex items-center h-10 px-2 leading-none text-gray-400 hover:text-white transition">
          Depoimentos
        </button>
        <a href="/login"
           class="inline-flex items-center h-10 px-2 leading-none text-gray-400 hover:text-white transition">
          Login
        </a>
        <button
          (click)="handleCheckout('premium_monthly')"
          class="inline-flex items-center h-10 px-4 leading-none bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] rounded-lg font-medium hover:shadow-lg hover:shadow-[#22d3ee]/25 transition-all transform hover:scale-105">
          Teste Grátis
        </button>
      </div>

      <!-- BOTÃO MOBILE (fica à direita no mobile) -->
      <button
        (click)="mobileMenuOpen = !mobileMenuOpen"
        class="md:hidden ml-auto inline-flex items-center h-10 p-2 text-gray-400 hover:text-white"
        [attr.aria-expanded]="mobileMenuOpen"
        aria-controls="mobile-menu"
        aria-label="Abrir menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- MENU MOBILE -->
  <div *ngIf="mobileMenuOpen" id="mobile-menu" class="md:hidden bg-[#0f131a] border-t border-[#1b2330]">
    <div class="px-4 py-4 space-y-3">
      <button (click)="scrollToSection('features')" class="block w-full text-left text-gray-400 hover:text-white py-2">Recursos</button>
      <button (click)="scrollToSection('pricing')" class="block w-full text-left text-gray-400 hover:text-white py-2">Preços</button>
      <button (click)="scrollToSection('testimonials')" class="block w-full text-left text-gray-400 hover:text-white py-2">Depoimentos</button>
      <a href="/login" class="block text-gray-400 hover:text-white py-2">Login</a>
      <button (click)="handleCheckout('premium_monthly')"
              class="w-full px-4 py-2 bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] rounded-lg font-medium">
        Teste Grátis
      </button>
    </div>
  </div>
</nav>


      <!-- HERO -->
      <section id="top" class="pt-24 pb-12 px-4 relative overflow-hidden">
        <div
          class="absolute inset-0 bg-gradient-to-b from-[#22d3ee]/5 to-transparent"
        ></div>
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#22d3ee]/10 rounded-full blur-3xl"
        ></div>

        <div class="max-w-7xl mx-auto text-center relative">
          <span
            class="inline-block px-4 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded-full text-sm font-medium mb-6"
          >
            🚀 +500 traders usando diariamente
          </span>

          <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span
              class="bg-gradient-to-r from-white via-[#22d3ee] to-[#f59e0b] bg-clip-text text-transparent"
              >Transforme seus trades</span
            ><br />
            <span class="text-white">em lucro consistente</span>
          </h1>

          <p
            class="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Sistema completo de análise com
            <span class="text-[#22d3ee]">IA avançada</span>, gestão de risco
            profissional e gamificação que mantém você
            <span class="text-[#10b981]"> disciplinado e lucrativo</span>.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              (click)="handleCheckout('premium_monthly')"
              class="group px-8 py-4 bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-[#22d3ee]/25 transform hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Começar Teste Grátis
              <svg
                class="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              (click)="videoOpen = true"
              class="px-8 py-4 bg-[#1b2330] border border-[#2a3441] rounded-lg font-bold text-lg hover:bg-[#2a3441] transition-all flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 4l12 6-12 6V4z" />
              </svg>
              Ver Demo (2 min)
            </button>
          </div>

          <p class="text-sm text-gray-500">
            ✓ 7 dias grátis • ✓ Cancele quando quiser • ✓ Sem cartão necessário
          </p>

          <!-- Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16">
            <div
              class="bg-[#0f131a]/90 border border-[#1b2330] rounded-xl p-6 backdrop-blur-md hover:border-[#22d3ee]/50 transition-all"
            >
              <div class="text-3xl font-bold text-[#22d3ee]">15K+</div>
              <div class="text-gray-400 text-sm mt-1">Trades Analisados</div>
            </div>
            <div
              class="bg-[#0f131a]/90 border border-[#1b2330] rounded-xl p-6 backdrop-blur-md hover:border-[#10b981]/50 transition-all"
            >
              <div class="text-3xl font-bold text-[#10b981]">68%</div>
              <div class="text-gray-400 text-sm mt-1">Win Rate Médio</div>
            </div>
            <div
              class="bg-[#0f131a]/90 border border-[#1b2330] rounded-xl p-6 backdrop-blur-md hover:border-[#f59e0b]/50 transition-all"
            >
              <div class="text-3xl font-bold text-[#f59e0b]">€3.2M</div>
              <div class="text-gray-400 text-sm mt-1">Volume Gerenciado</div>
            </div>
            <div
              class="bg-[#0f131a]/90 border border-[#1b2330] rounded-xl p-6 backdrop-blur-md hover:border-[#8b5cf6]/50 transition-all"
            >
              <div class="text-3xl font-bold text-[#8b5cf6]">4.9★</div>
              <div class="text-gray-400 text-sm mt-1">Avaliação</div>
            </div>
          </div>
        </div>
      </section>

      <!-- TRUST BAR -->
      <section class="px-4 pb-6">
        <div
          class="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 items-center opacity-80"
        >
          <div
            *ngFor="let brand of brands"
            class="text-center text-sm text-gray-400 border border-[#1b2330] rounded-lg py-3"
          >
            Compatível com {{ brand }}
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section id="features" class="py-20 px-4 bg-[#0f131a]/50">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-4xl font-bold mb-4">
              Recursos que fazem a diferença
            </h2>
            <p class="text-gray-400 text-lg">
              Tudo que você precisa para evoluir como trader
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <!-- AI -->
            <div
              class="group bg-[#0f131a]/90 border border-[#1b2330] rounded-xl p-6 hover:border-[#22d3ee]/50 transition-all hover:transform hover:scale-105"
            >
              <div
                class="w-12 h-12 bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] rounded-lg flex items-center justify-center mb-4"
              >
                <!-- ícone brain -->
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M7 8a4 4 0 118 0h1a3 3 0 110 6h-1a4 4 0 11-8 0H6a3 3 0 110-6h1z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-3">Análise com IA Avançada</h3>
              <p class="text-gray-400 mb-4">
                Nossa IA analisa padrões invisíveis ao olho humano e fornece
                insights acionáveis
              </p>
              <ul class="space-y-2 text-sm text-gray-400">
                <li class="flex items-center gap-2">
                  <span class="text-[#10b981]">✔</span> Detecção de padrões
                  ocultos
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-[#10b981]">✔</span> Sugestões personalizadas
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-[#10b981]">✔</span> Análise preditiva
                </li>
              </ul>
            </div>

            <!-- Risk -->
            <div
              class="group bg-[#0f131a]/90 border border-[#1b2330] rounded-xl p-6 hover:border-[#10b981]/50 transition-all hover:transform hover:scale-105"
            >
              <div
                class="w-12 h-12 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-lg flex items-center justify-center mb-4"
              >
                <!-- ícone shield -->
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-3">Gestão de Risco Pro</h3>
              <p class="text-gray-400 mb-4">
                Proteja seu capital com ferramentas profissionais de gestão de
                risco
              </p>
              <ul class="space-y-2 text-sm text-gray-400">
                <li class="flex items-center gap-2">
                  <span class="text-[#10b981]">✔</span> Cálculo automático de
                  posição
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-[#10b981]">✔</span> Alertas de drawdown
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-[#10b981]">✔</span> Stop loss inteligente
                </li>
              </ul>
            </div>

            <!-- Gamification -->
            <div
              class="group bg-[#0f131a]/90 border border-[#1b2330] rounded-xl p-6 hover:border-[#f59e0b]/50 transition-all hover:transform hover:scale-105"
            >
              <div
                class="w-12 h-12 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-lg flex items-center justify-center mb-4"
              >
                <!-- ícone trophy -->
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8 21h8M12 17a5 5 0 005-5V4H7v8a5 5 0 005 5zm9-13h-3a5 5 0 002 4c1.66 0 3-1.79 3-4zM3 4h3a5 5 0 01-2 4C2.34 8 1 6.21 1 4z"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-3">TraderQuest Gamificação</h3>
              <p class="text-gray-400 mb-4">
                Sistema de gamificação que mantém você motivado e disciplinado
              </p>
              <ul class="space-y-2 text-sm text-gray-400">
                <li class="flex items-center gap-2">
                  <span class="text-[#10b981]">✔</span> Níveis e conquistas
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-[#10b981]">✔</span> Desafios diários
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-[#10b981]">✔</span> Ranking global
                </li>
              </ul>
            </div>
          </div>

          <!-- Chips -->
          <div class="grid md:grid-cols-4 gap-4 mt-12">
            <div
              *ngFor="let f of quickFeatures"
              class="bg-[#0f131a]/90 border border-[#1b2330] rounded-lg p-4 text-center"
            >
              <div class="text-2xl mb-2">{{ f.emoji }}</div>
              <div class="font-semibold">{{ f.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- DEMO MODAL -->
      <div
        *ngIf="videoOpen"
        role="dialog"
        aria-modal="true"
        class="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
        (click)="videoOpen = false"
      >
        <div
          class="bg-[#0f131a] border border-[#1b2330] rounded-xl max-w-3xl w-full overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-[#1b2330]"
          >
            <div class="font-semibold flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 4l12 6-12 6V4z" />
              </svg>
              Demo — 2 minutos
            </div>
            <button
              class="text-gray-400 hover:text-white"
              (click)="videoOpen = false"
              aria-label="Fechar"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div class="aspect-video w-full bg-black">
            <!-- Troque a URL pelo seu vídeo -->
            <iframe
              title="TradingNoteX Demo"
              class="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>

      <!-- PRICING -->
      <section id="pricing" class="py-20 px-4">
        <div class="max-w-5xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-4xl font-bold mb-4">Invista no seu sucesso</h2>
            <p class="text-gray-400 text-lg mb-4">
              Escolha o plano ideal para sua jornada
            </p>

            <div
              class="inline-flex items-center bg-[#1b2330] rounded-lg p-1"
              role="tablist"
              aria-label="Alternar cobrança"
            >
              <button
                (click)="setBilling('monthly')"
                class="px-4 py-2 rounded-lg transition"
                [ngClass]="
                  billingCycle === 'monthly'
                    ? 'bg-[#22d3ee] text-black'
                    : 'text-gray-400'
                "
                role="tab"
                [attr.aria-selected]="billingCycle === 'monthly'"
              >
                Mensal
              </button>
              <button
                (click)="setBilling('yearly')"
                class="px-4 py-2 rounded-lg transition"
                [ngClass]="
                  billingCycle === 'yearly'
                    ? 'bg-[#22d3ee] text-black'
                    : 'text-gray-400'
                "
                role="tab"
                [attr.aria-selected]="billingCycle === 'yearly'"
              >
                Anual (-20%)
              </button>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <!-- Basic -->
            <div
              class="bg-[#0f131a]/90 border border-[#1b2330] rounded-xl p-6 flex flex-col"
            >
              <h3 class="text-2xl font-bold mb-2">Basic</h3>
              <p class="text-gray-400 mb-4">Para começar</p>
              <div class="mb-6">
                <span class="text-4xl font-bold">Grátis</span>
              </div>
              <ul class="space-y-3 mb-8 text-sm flex-1">
                <li class="flex items-center">
                  <span class="text-[#10b981] mr-3">✔</span> 100 trades/mês
                </li>
                <li class="flex items-center">
                  <span class="text-[#10b981] mr-3">✔</span> Dashboard básico
                </li>
                <li class="flex items-center">
                  <span class="text-[#10b981] mr-3">✔</span> 1 conta de trading
                </li>
                <li class="flex items-center text-gray-500">
                  <span class="mr-3">✖</span> Sem análise IA
                </li>
                <li class="flex items-center text-gray-500">
                  <span class="mr-3">✖</span> Sem TraderQuest
                </li>
              </ul>
              <button
                (click)="go('/register')"
                class="w-full py-3 bg-[#1b2330] rounded-lg font-medium hover:bg-[#2a3441] transition"
              >
                Começar Grátis
              </button>
            </div>

            <!-- Premium -->
            <div
              class="bg-[#0f131a]/90 border-2 border-[#f59e0b] rounded-xl p-6 relative transform md:scale-105 flex flex-col"
            >
              <div class="absolute -top-4 left-1/2 -translate-x-1/2">
                <span
                  class="bg-gradient-to-r from-[#f59e0b] to-yellow-400 text-black text-sm px-4 py-1 rounded-full font-bold"
                  >MAIS POPULAR</span
                >
              </div>
              <h3 class="text-2xl font-bold mb-2">Premium</h3>
              <p class="text-gray-400 mb-4">Para traders sérios</p>
              <div class="mb-6">
                <span class="text-4xl font-bold"
                  >€{{ pricePremium().toFixed(2) }}</span
                >
                <span class="text-gray-400">/mês</span>
                <div
                  *ngIf="subtitlePremium()"
                  class="text-sm text-[#10b981] mt-1"
                >
                  {{ subtitlePremium() }}
                </div>
              </div>
              <ul class="space-y-3 mb-8 text-sm flex-1">
                <li class="flex items-center">
                  <span class="text-[#f59e0b] mr-3">★</span> Trades ilimitados
                </li>
                <li class="flex items-center">
                  <span class="text-[#f59e0b] mr-3">★</span> Análise IA (10
                  créditos/mês)
                </li>
                <li class="flex items-center">
                  <span class="text-[#f59e0b] mr-3">★</span> 5 contas de trading
                </li>
                <li class="flex items-center">
                  <span class="text-[#f59e0b] mr-3">★</span> TraderQuest
                  completo
                </li>
                <li class="flex items-center">
                  <span class="text-[#f59e0b] mr-3">★</span> Compartilhar com
                  mentor
                </li>
              </ul>
              <button
                (click)="
                  handleCheckout(
                    billingCycle === 'yearly'
                      ? 'premium_yearly'
                      : 'premium_monthly'
                  )
                "
                class="w-full py-3 bg-gradient-to-r from-[#f59e0b] to-yellow-400 text-black rounded-lg font-bold hover:shadow-lg hover:shadow-[#f59e0b]/25 transition-all transform hover:scale-105"
              >
                Teste Grátis 7 Dias
              </button>
              <p class="text-xs text-center text-gray-400 mt-2">
                Cancele quando quiser
              </p>
            </div>

            <!-- Pro -->
            <div
              class="bg-[#0f131a]/90 border border-[#1b2330] rounded-xl p-6 flex flex-col"
            >
              <h3 class="text-2xl font-bold mb-2">Pro</h3>
              <p class="text-gray-400 mb-4">Para prop firms</p>
              <div class="mb-6">
                <span class="text-4xl font-bold">€29.99</span
                ><span class="text-gray-400">/mês</span>
              </div>
              <ul class="space-y-3 mb-8 text-sm flex-1">
                <li *ngFor="let t of proFeatures" class="flex items-center">
                  <span
                    class="w-5 h-5 bg-[#8b5cf6] rounded text-white text-xs flex items-center justify-center mr-3"
                    >♦</span
                  >
                  {{ t }}
                </li>
              </ul>
              <button
                (click)="handleCheckout('pro_monthly')"
                class="w-full py-3 bg-[#8b5cf6] text-white rounded-lg font-medium hover:bg-[#7c3aed] transition"
              >
                Começar Pro
              </button>
            </div>
          </div>

          <!-- Comparação -->
          <div id="compare" class="mt-12 overflow-x-auto">
            <table
              class="min-w-full text-sm border border-[#1b2330] rounded-xl overflow-hidden"
            >
              <thead class="bg-[#0f131a]">
                <tr>
                  <th class="p-3 text-left">Recurso</th>
                  <th class="p-3 text-center">Basic</th>
                  <th class="p-3 text-center">Premium</th>
                  <th class="p-3 text-center">Pro</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#1b2330]">
                <tr
                  *ngFor="let row of comparisonRows"
                  class="hover:bg-white/[0.02]"
                >
                  <td class="p-3 text-gray-300">{{ row.name }}</td>
                  <td class="p-3 text-center">{{ row.values[0] }}</td>
                  <td class="p-3 text-center">{{ row.values[1] }}</td>
                  <td class="p-3 text-center">{{ row.values[2] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- TESTIMONIALS -->
      <section id="testimonials" class="py-20 px-4 bg-[#0f131a]/50">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-4xl font-bold text-center mb-12">
            Traders de sucesso com TradingNoteX
          </h2>

          <div class="grid md:grid-cols-3 gap-6">
            <div
              *ngFor="let t of testimonials"
              class="bg-[#0f131a]/90 border border-[#1b2330] rounded-xl p-6"
            >
              <div class="flex items-center mb-4">
                <div
                  class="w-12 h-12 rounded-full mr-3"
                  [ngClass]="t.avatar"
                ></div>
                <div>
                  <div class="font-bold">{{ t.name }}</div>
                  <div class="text-sm text-gray-400">{{ t.role }}</div>
                </div>
              </div>
              <div class="flex gap-1 mb-3" aria-label="5 estrelas">
                <span *ngFor="let _ of five" class="text-[#f59e0b]">★</span>
              </div>
              <p class="text-gray-300">“{{ t.quote }}”</p>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="py-20 px-4">
        <div class="max-w-3xl mx-auto">
          <h2 class="text-4xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>

          <div class="space-y-4">
            <div
              *ngFor="let faq of faqs; let i = index"
              class="bg-[#0f131a]/90 border border-[#1b2330] rounded-xl overflow-hidden"
            >
              <button
                (click)="toggleFaq(i)"
                class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-[#1b2330]/50 transition"
                [attr.aria-expanded]="activeFaq === i"
              >
                <span class="font-semibold">{{ faq.q }}</span>
                <svg
                  class="w-5 h-5 transition-transform"
                  [ngClass]="activeFaq === i ? 'rotate-180' : ''"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div *ngIf="activeFaq === i" class="px-6 pb-4 text-gray-400">
                {{ faq.a }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FINAL CTA -->
      <section
        class="py-20 px-4 bg-gradient-to-r from-[#22d3ee]/10 to-[#f59e0b]/10"
      >
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-4xl font-bold mb-4">
            Pronto para levar seu trading ao próximo nível?
          </h2>
          <p class="text-xl text-gray-400 mb-8">
            Junte-se a centenas de traders que já transformaram seus resultados
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              (click)="handleCheckout('premium_monthly')"
              class="px-8 py-4 bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-[#22d3ee]/25 transform hover:scale-105 transition-all"
            >
              Começar Teste Grátis Agora
            </button>
            <button
              (click)="scrollToSection('pricing')"
              class="px-8 py-4 bg-[#1b2330] border border-[#2a3441] rounded-lg font-bold text-lg hover:bg-[#2a3441] transition-all"
            >
              Ver Planos
            </button>
          </div>

          <div class="mt-8 flex items-center justify-center gap-8">
            <div class="flex items-center gap-2">
              <svg
                class="w-5 h-5 text-[#10b981]"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                />
              </svg>
              <span class="text-sm text-gray-400">Pagamento Seguro</span>
            </div>
            <div class="flex items-center gap-2">
              <svg
                class="w-5 h-5 text-[#10b981]"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2"
                />
              </svg>
              <span class="text-sm text-gray-400">Garantia 30 dias</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[#f59e0b]">★</span>
              <span class="text-sm text-gray-400">4.9/5 Avaliação</span>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="py-12 px-4 border-t border-[#1b2330]">
        <div class="max-w-7xl mx-auto">
          <div class="grid md:grid-cols-4 gap-8">
            <div>
              <span
                class="text-xl font-bold bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] bg-clip-text text-transparent"
              >
                TradingNoteX
              </span>
              <p class="text-gray-400 text-sm mt-2">
                Sistema profissional de análise de trades com IA
              </p>
              <div class="mt-4 text-xs text-gray-500 flex items-center gap-2">
                <!-- cartão -->
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                  <path d="M2 10h20" />
                </svg>
                Pagamentos por LemonSqueezy
              </div>
            </div>

            <div>
              <h4 class="font-semibold mb-3">Produto</h4>
              <ul class="space-y-2 text-sm text-gray-400">
                <li>
                  <button
                    (click)="scrollToSection('features')"
                    class="hover:text-white transition"
                  >
                    Recursos
                  </button>
                </li>
                <li>
                  <button
                    (click)="scrollToSection('pricing')"
                    class="hover:text-white transition"
                  >
                    Preços
                  </button>
                </li>
                <li>
                  <a href="/login" class="hover:text-white transition">Login</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold mb-3">Suporte</h4>
              <ul class="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" class="hover:text-white transition"
                    >Central de Ajuda</a
                  >
                </li>
                <li>
                  <a href="#" class="hover:text-white transition">Contato</a>
                </li>
                <li>
                  <a href="#" class="hover:text-white transition">Status</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold mb-3">Legal</h4>
              <ul class="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" class="hover:text-white transition"
                    >Termos de Uso</a
                  >
                </li>
                <li>
                  <a href="#" class="hover:text-white transition"
                    >Privacidade</a
                  >
                </li>
                <li>
                  <a href="#" class="hover:text-white transition">Cookies</a>
                </li>
              </ul>
            </div>
          </div>

          <div
            class="mt-8 pt-8 border-t border-[#1b2330] text-center text-sm text-gray-400"
          >
            © 2025 TradingNoteX. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <!-- CTA Mobile -->
      <div class="fixed bottom-4 left-1/2 -translate-x-1/2 md:hidden z-40">
        <button
          (click)="handleCheckout('premium_monthly')"
          class="px-6 py-3 rounded-full bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] text-black font-semibold shadow-lg"
        >
          Começar Grátis
        </button>
      </div>

      <!-- Scroll to Top -->
      <button
        *ngIf="showScrollTop"
        (click)="scrollTop()"
        class="fixed bottom-6 right-6 p-3 rounded-full bg-[#1b2330] border border-[#2a3441] hover:bg-[#2a3441] transition"
        aria-label="Voltar ao topo"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>

      <!-- Cookie Bar -->
      <div *ngIf="showCookieBar" class="fixed bottom-0 inset-x-0 z-50">
        <div
          class="mx-auto max-w-5xl m-4 p-4 rounded-xl border border-[#1b2330] bg-[#0f131a]/95 backdrop-blur"
        >
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between"
          >
            <div class="text-sm text-gray-300 flex-1">
              Usamos cookies para melhorar sua experiência e analisar o uso do
              site. Ao continuar, você concorda com nossa
              <a href="#" class="underline">Política de Cookies</a>.
            </div>
            <div class="flex gap-2">
              <button
                (click)="acceptCookies()"
                class="px-4 py-2 rounded-lg bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] text-black font-medium"
              >
                Aceitar
              </button>
              <a
                href="#"
                class="px-4 py-2 rounded-lg border border-[#2a3441] hover:bg-[#2a3441]"
                >Preferências</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* estilos mínimos extra; restante via Tailwind */
      :host {
        display: block;
      }
    `,
  ],
})
export class HomeComponent {
  isScrolled = false;
  mobileMenuOpen = false;
  billingCycle: BillingCycle = 'monthly';
  activeFaq: number | null = null;
  showCookieBar = false;
  showScrollTop = false;
  videoOpen = false;

  brands = ['NinjaTrader', 'TradingView', 'MetaTrader', 'Interactive Brokers'];

  quickFeatures = [
    { emoji: '📊', label: 'Dashboard Avançado' },
    { emoji: '📈', label: 'Gráficos Interativos' },
    { emoji: '💼', label: 'Multi-contas' },
    { emoji: '👥', label: 'Compartilhar Mentor' },
  ];

  proFeatures = [
    'Tudo do Premium',
    '50 créditos IA/mês',
    'Contas ilimitadas',
    'API access',
    'Suporte prioritário',
  ];

  comparisonRows = [
    { name: 'Trades por mês', values: ['100', 'Ilimitados', 'Ilimitados'] },
    { name: 'Contas de trading', values: ['1', '5', 'Ilimitadas'] },
    { name: 'Análises com IA', values: ['—', '10/mês', '50/mês'] },
    { name: 'TraderQuest', values: ['—', 'Completo', 'Completo'] },
    { name: 'Acesso API', values: ['—', '—', 'Sim'] },
    {
      name: 'Suporte',
      values: ['Email', 'Chat prioritário', 'Prioritário + SLA'],
    },
  ];

  testimonials = [
    {
      name: 'João Silva',
      role: 'Trader há 3 anos',
      quote:
        'A análise com IA me ajudou a identificar padrões que eu nunca tinha percebido. Meu win rate subiu de 45% para 68% em 3 meses!',
      avatar: 'bg-gradient-to-r from-[#22d3ee] to-[#f59e0b]',
    },
    {
      name: 'Maria Costa',
      role: 'Prop Trader',
      quote:
        'O sistema de gestão de risco salvou minha conta várias vezes. Agora consigo manter consistência mesmo em mercados voláteis.',
      avatar: 'bg-gradient-to-r from-[#10b981] to-[#22d3ee]',
    },
    {
      name: 'Pedro Mendes',
      role: 'Day Trader',
      quote:
        'TraderQuest tornou o trading mais divertido e me mantém disciplinado. É viciante ver meu nível subindo!',
      avatar: 'bg-gradient-to-r from-[#8b5cf6] to-[#ec4899]',
    },
  ];

  faqs = [
    {
      q: 'Como funciona o período de teste grátis?',
      a: 'Você tem 7 dias completos para testar todos os recursos Premium sem custo. Não pedimos cartão de crédito e você pode cancelar a qualquer momento.',
    },
    {
      q: 'Posso cancelar minha assinatura?',
      a: 'Sim! Você pode cancelar a qualquer momento diretamente no seu painel. Você manterá o acesso até o fim do período pago.',
    },
    {
      q: 'Como funcionam os créditos de IA?',
      a: 'Usuários Premium recebem 10 créditos por mês. Cada análise básica usa 1 crédito, análises avançadas usam 3. Você pode comprar créditos extras se precisar.',
    },
    {
      q: 'Posso migrar do Basic para Premium?',
      a: 'Claro! Você pode fazer upgrade a qualquer momento e seus dados serão mantidos. Você também ganha um desconto proporcional.',
    },
    {
      q: 'Vocês oferecem suporte?',
      a: 'Sim! Usuários Basic têm suporte por email. Premium e Pro têm suporte prioritário via chat ao vivo e resposta em até 2 horas.',
    },
  ];

  five = new Array(5);

  ngOnInit() {
    // cookie bar
    const consent = localStorage.getItem('tnx_cookie_consent');
    if (!consent) this.showCookieBar = true;
  }

  @HostListener('window:scroll', [])
  onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    this.isScrolled = y > 20;
    this.showScrollTop = y > 400;
  }

  setBilling(val: BillingCycle) {
    this.billingCycle = val;
  }

  pricePremium(): number {
    return this.billingCycle === 'yearly' ? 7.99 : 9.99;
  }

  subtitlePremium(): string | null {
    return this.billingCycle === 'yearly' ? 'Economize €24/ano' : null;
  }

  handleCheckout(
    planKey: 'premium_monthly' | 'premium_yearly' | 'pro_monthly'
  ) {
    const checkoutUrls: Record<string, string> = {
      premium_monthly:
        'https://tradingnotex.lemonsqueezy.com/checkout/buy/premium-monthly',
      premium_yearly:
        'https://tradingnotex.lemonsqueezy.com/checkout/buy/premium-yearly',
      pro_monthly:
        'https://tradingnotex.lemonsqueezy.com/checkout/buy/pro-monthly',
    };
    const url = checkoutUrls[planKey];
    if (url) window.open(url, '_blank');
  }

  scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.mobileMenuOpen = false;
    }
  }

  go(path: string) {
    window.location.href = path;
  }

  acceptCookies() {
    localStorage.setItem('tnx_cookie_consent', 'true');
    this.showCookieBar = false;
  }

  scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleFaq(i: number) {
    this.activeFaq = this.activeFaq === i ? null : i;
  }
}
