import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes,
} from '@angular/animations';

type BillingCycle = 'monthly' | 'yearly';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '0.6s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('0.3s ease-out', style({ transform: 'translateX(0)' })),
      ]),
    ]),
    trigger('pulse', [
      transition(':enter', [
        animate(
          '1s ease-in-out',
          keyframes([
            style({ transform: 'scale(1)' }),
            style({ transform: 'scale(1.05)' }),
            style({ transform: 'scale(1)' }),
          ])
        ),
      ]),
    ]),
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '0.8s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '0.4s ease-in',
          style({ opacity: 0, transform: 'translateY(-10px)' })
        ),
      ]),
    ]),
  ],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-[#0a0c10] via-[#0f131a] to-[#0a0c10] text-gray-100 overflow-x-hidden"
    >
      <!-- Animated Background Elements -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          class="absolute top-20 left-10 w-72 h-72 bg-[#22d3ee]/10 rounded-full blur-3xl animate-float"
        ></div>
        <div
          class="absolute bottom-20 right-10 w-96 h-96 bg-[#f59e0b]/10 rounded-full blur-3xl animate-float-delayed"
        ></div>
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#22d3ee]/5 to-[#f59e0b]/5 rounded-full blur-3xl animate-spin-slow"
        ></div>
      </div>

      <!-- Enhanced Navigation -->
      <nav
        [ngClass]="{
          'bg-[#0a0c10]/95 backdrop-blur-xl border-b border-[#1b2330] shadow-lg':
            isScrolled,
          'bg-transparent': !isScrolled
        }"
        class="fixed top-0 w-full z-50 transition-all duration-500"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <!-- Logo with Animation -->
            <div
              class="flex items-center gap-2 cursor-pointer group"
              (click)="scrollToSection('top')"
            >
              <div class="relative">
                <div
                  class="absolute inset-0 bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] blur-lg opacity-50 group-hover:opacity-100 transition-opacity"
                ></div>
                <span
                  class="relative text-2xl font-bold bg-gradient-to-r from-[#22d3ee] via-[#10b981] to-[#f59e0b] bg-clip-text text-transparent animate-gradient"
                >
                  TradingNoteX
                </span>
              </div>
              <span
                class="hidden md:inline-block px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] text-xs rounded-full font-semibold"
              >
                PRO
              </span>
            </div>

            <!-- Desktop Menu with Hover Effects -->
            <div class="hidden md:flex items-center gap-6">
              <button
                *ngFor="let item of menuItems"
                (click)="scrollToSection(item.id)"
                class="relative px-3 py-2 text-gray-300 hover:text-white transition-all group"
              >
                <span class="relative z-10">{{ item.label }}</span>
                <span
                  class="absolute inset-0 bg-gradient-to-r from-[#22d3ee]/20 to-[#f59e0b]/20 rounded-lg scale-0 group-hover:scale-100 transition-transform"
                ></span>
              </button>

              <div class="h-8 w-px bg-[#1b2330]"></div>

              <a
                href="/login"
                class="px-4 py-2 text-gray-300 hover:text-white transition-all hover:bg-white/5 rounded-lg"
              >
                Login
              </a>

              <button
                (click)="handleCheckout('premium_monthly')"
                class="relative px-6 py-2.5 bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] rounded-lg font-semibold overflow-hidden group"
              >
                <span class="relative z-10 flex items-center gap-2">
                  Teste Grátis
                  <svg
                    class="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
                <div
                  class="absolute inset-0 bg-gradient-to-r from-[#f59e0b] to-[#22d3ee] opacity-0 group-hover:opacity-100 transition-opacity"
                ></div>
              </button>
            </div>

            <!-- Mobile Menu Button -->
            <button
              (click)="mobileMenuOpen = !mobileMenuOpen"
              class="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  [attr.d]="
                    mobileMenuOpen
                      ? 'M6 18L18 6M6 6l12 12'
                      : 'M4 6h16M4 12h16M4 18h16'
                  "
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Enhanced Mobile Menu -->
        <div
          *ngIf="mobileMenuOpen"
          @slideIn
          class="md:hidden bg-[#0f131a]/95 backdrop-blur-xl border-t border-[#1b2330]"
        >
          <div class="px-4 py-6 space-y-3">
            <button
              *ngFor="let item of menuItems"
              (click)="scrollToSection(item.id); mobileMenuOpen = false"
              class="block w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              {{ item.label }}
            </button>
            <div class="h-px bg-[#1b2330] my-4"></div>
            <a
              href="/login"
              class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              Login
            </a>
            <button
              (click)="handleCheckout('premium_monthly')"
              class="w-full px-4 py-3 bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] rounded-lg font-semibold"
            >
              Começar Teste Grátis
            </button>
          </div>
        </div>
      </nav>

  <!-- HERO -->
<section id="top" class="relative bg-gradient-to-br from-[#0a0c10] to-[#0f131a] text-gray-100 min-h-[90vh] flex items-center justify-center">
  <div class="max-w-7xl mx-auto px-6 lg:px-12 text-center">

    <!-- Headline -->
    <h1 class="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
      90% dos traders <span class="text-[#ef4444]">perdem dinheiro</span>.<br />
      Você não precisa ser um deles.
    </h1>

    <!-- Subheadline -->
    <p class="text-lg md:text-xl text-gray-400 mb-10 max-w-3xl mx-auto">
      Falta de disciplina, emoções descontroladas e ausência de métricas claras
      estão entre os maiores motivos. O <span class="text-[#22d3ee] font-semibold">TradingNoteX</span>
      ajuda você a virar o jogo com <span class="text-[#22d3ee]">organização</span>,
      <span class="text-[#f59e0b]">análise por IA</span> e
      <span class="text-[#10b981]">gamificação</span>.
    </p>

    <!-- Estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
      <div class="bg-[#0f131a]/70 backdrop-blur border border-[#1b2330] rounded-2xl p-6">
        <div class="text-3xl font-bold text-[#ef4444] mb-2">90%</div>
        <p class="text-sm text-gray-400">dos traders perdem capital por falta de disciplina e gestão</p>
      </div>
      <div class="bg-[#0f131a]/70 backdrop-blur border border-[#1b2330] rounded-2xl p-6">
        <div class="text-3xl font-bold text-[#f59e0b] mb-2">70%</div>
        <p class="text-sm text-gray-400">repetem os mesmos erros emocionais sem perceber</p>
      </div>
      <div class="bg-[#0f131a]/70 backdrop-blur border border-[#1b2330] rounded-2xl p-6">
        <div class="text-3xl font-bold text-[#22d3ee] mb-2">+3x</div>
        <p class="text-sm text-gray-400">chance de consistência com métricas e acompanhamento por IA</p>
      </div>
    </div>

    <!-- CTA -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button
        (click)="handleCheckout('premium_monthly')"
        class="px-8 py-4 bg-gradient-to-r from-[#22d3ee] to-[#10b981] text-white font-semibold rounded-xl shadow-lg hover:scale-105 hover:shadow-[#22d3ee]/30 transition-all duration-300"
      >
        Começar Agora
      </button>
      <button
        (click)="scrollToSection('journey')"
        class="px-8 py-4 bg-[#1b2330] text-gray-300 font-semibold rounded-xl border border-[#22d3ee]/30 hover:bg-[#0f131a] transition-all duration-300"
      >
        Ver como funciona
      </button>
    </div>

  </div>
</section>


      <!-- 1) DORES & SOLUÇÕES + DEPOIMENTOS -->
      <section class="py-20 px-4" id="pains">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              Dores reais. Soluções práticas.
            </h2>
            <p class="text-gray-400 text-lg">
              O que mais trava os traders — e como o TradingNoteX ajuda você a
              destravar.
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-6 mb-12">
            <div
              class="bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-6"
            >
              <h3 class="font-semibold mb-2">Indisciplina e Overtrading</h3>
              <p class="text-gray-400 text-sm">
                Checklists, limites e rotina gamificada para manter o plano e
                reduzir impulsos.
              </p>
            </div>
            <div
              class="bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-6"
            >
              <h3 class="font-semibold mb-2">Gatilhos Emocionais Repetidos</h3>
              <p class="text-gray-400 text-sm">
                Registro de contexto + insights de IA para identificar padrões
                emocionais.
              </p>
            </div>
            <div
              class="bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-6"
            >
              <h3 class="font-semibold mb-2">Falta de Métricas Claras</h3>
              <p class="text-gray-400 text-sm">
                KPIs profissionais, por hora/dia/contexto, para decisões
                objetivas.
              </p>
            </div>
          </div>

          <!-- Depoimentos -->
          <div id="testimonials" class="py-4 overflow-hidden">
            <div class="text-center mb-8">
              <h3 class="text-2xl md:text-3xl font-bold mb-2">
                Histórias de transformação
              </h3>
              <p class="text-gray-400">
                Resultados reais de quem focou em disciplina e evolução.
              </p>
            </div>
            <div class="relative">
              <div class="flex gap-6 animate-scroll">
                <div
                  *ngFor="let testimonial of testimonialsLoop"
                  class="min-w-[350px] bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-6 hover:border-[#22d3ee]/30 transition-all duration-300"
                >
                  <div class="flex items-center mb-4">
                    <div
                      class="w-12 h-12 rounded-full {{
                        testimonial.gradient
                      }} flex items-center justify-center text-white font-bold text-lg"
                    >
                      {{ testimonial.initials }}
                    </div>
                    <div class="ml-3">
                      <div class="font-semibold">{{ testimonial.name }}</div>
                      <div class="text-sm text-gray-400">
                        {{ testimonial.role }}
                      </div>
                    </div>
                    <div class="ml-auto flex gap-0.5">
                      <span
                        *ngFor="let _ of [1, 2, 3, 4, 5]"
                        class="text-[#f59e0b]"
                        >★</span
                      >
                    </div>
                  </div>
                  <p class="text-gray-300 italic">"{{ testimonial.quote }}"</p>
                  <div class="mt-4 pt-4 border-t border-[#1b2330]">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-400">Melhoria</span>
                      <span class="text-[#10b981] font-semibold">{{
                        testimonial.improvement
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2) CAMINHO PARA SE TORNAR TRADER PROFISSIONAL (HOW IT WORKS) -->
      <section class="py-20 px-4 relative" id="journey">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              O caminho para se tornar um trader profissional
            </h2>
            <p class="text-gray-400 text-lg">
              Metodologia comprovada em 3 pilares fundamentais
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8 relative">
            <!-- Connection Line -->
            <div
              class="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[#22d3ee] via-[#10b981] to-[#f59e0b]"
            ></div>

            <!-- Step 1 -->
            <div class="relative group">
              <div
                class="bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-8 hover:border-[#22d3ee]/50 transition-all duration-300 hover:transform hover:-translate-y-2"
              >
                <div
                  class="absolute -top-4 left-8 bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] text-white text-sm px-3 py-1 rounded-full font-bold"
                >
                  Registro
                </div>
                <div
                  class="w-16 h-16 bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                >
                  <svg
                    class="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-3">Documente cada operação</h3>
                <p class="text-gray-400">
                  Registre contexto, emoções e decisões. A clareza começa com
                  dados organizados.
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="relative group">
              <div
                class="bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-8 hover:border-[#10b981]/50 transition-all duration-300 hover:transform hover:-translate-y-2"
              >
                <div
                  class="absolute -top-4 left-8 bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-sm px-3 py-1 rounded-full font-bold"
                >
                  Análise
                </div>
                <div
                  class="w-16 h-16 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                >
                  <svg
                    class="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-3">Identifique seus padrões</h3>
                <p class="text-gray-400">
                  Descubra pontos fortes, fraquezas e gatilhos emocionais que
                  impactam suas decisões.
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="relative group">
              <div
                class="bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-8 hover:border-[#f59e0b]/50 transition-all duration-300 hover:transform hover:-translate-y-2"
              >
                <div
                  class="absolute -top-4 left-8 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white text-sm px-3 py-1 rounded-full font-bold"
                >
                  Evolução
                </div>
                <div
                  class="w-16 h-16 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                >
                  <svg
                    class="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-3">Desenvolva disciplina</h3>
                <p class="text-gray-400">
                  Transforme insights em hábitos profissionais e construa
                  consistência duradoura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3) APRESENTAÇÃO DO PRODUTO & FERRAMENTAS (FEATURES) -->
      <section id="features" class="py-20 px-4">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              Conheça o TradingNoteX e suas ferramentas
            </h2>
            <p class="text-gray-400 text-lg">
              O ecossistema completo para análise, disciplina e evolução
              contínua
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <!-- Feature Cards -->
            <div
              *ngFor="let feature of mainFeatures; let i = index"
              class="group relative"
              [style.animation-delay.ms]="i * 100"
            >
              <div
                class="absolute inset-0 bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
              ></div>
              <div
                class="relative bg-[#0f131a]/90 border border-[#1b2330] rounded-2xl p-8 hover:border-transparent transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl"
              >
                <div
                  [ngClass]="feature.gradient"
                  class="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                >
                  <div
                    [innerHTML]="feature.icon"
                    class="w-7 h-7 text-white"
                  ></div>
                </div>
                <h3 class="text-xl font-bold mb-3">{{ feature.title }}</h3>
                <p class="text-gray-400 mb-4">{{ feature.description }}</p>
                <ul class="space-y-2 text-sm">
                  <li
                    *ngFor="let item of feature.items"
                    class="flex items-start gap-2"
                  >
                    <svg
                      class="w-5 h-5 text-[#10b981] shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span class="text-gray-300">{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Quick Features Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <div
              *ngFor="let feature of quickFeatures"
              class="group bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-xl p-4 text-center hover:border-[#22d3ee]/50 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div
                class="text-3xl mb-2 group-hover:scale-110 transition-transform"
              >
                {{ feature.emoji }}
              </div>
              <div class="font-medium text-sm">{{ feature.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4) ESTIMATIVA DE TEMPO (EVOLUTION TRACKER) -->
      <section
        class="py-20 px-4 bg-gradient-to-b from-transparent via-[#0f131a]/50 to-transparent"
        id="timeline"
      >
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              Estimativa de tempo para proficiência
            </h2>
            <p class="text-gray-400 text-lg">
              Veja como sua rotina e registro aceleram sua evolução
            </p>
          </div>

          <div
            class="bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-8"
          >
            <div class="grid md:grid-cols-2 gap-8">
              <!-- Inputs -->
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">
                    Tempo de Experiência
                  </label>
                  <div class="relative">
                    <input
                      type="range"
                      [(ngModel)]="evolutionTracker.experience"
                      (input)="calculateEvolution()"
                      min="0"
                      max="60"
                      step="1"
                      class="w-full"
                    />
                    <div
                      class="flex justify-between text-xs text-gray-500 mt-1"
                    >
                      <span>Iniciante</span>
                      <span class="font-bold text-[#22d3ee]">
                        {{
                          evolutionTracker.experience < 12
                            ? evolutionTracker.experience + ' meses'
                            : Math.floor(evolutionTracker.experience / 12) +
                              ' anos'
                        }}
                      </span>
                      <span>5+ anos</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">
                    Frequência de Registro Atual
                  </label>
                  <div class="relative">
                    <select
                      [(ngModel)]="evolutionTracker.currentTracking"
                      (change)="calculateEvolution()"
                      class="w-full bg-[#1b2330] border border-[#2a3441] rounded-lg px-4 py-2 text-white"
                    >
                      <option value="none">
                        Não registro minhas operações
                      </option>
                      <option value="sometimes">Registro às vezes</option>
                      <option value="basic">
                        Registro básico (entrada/saída)
                      </option>
                      <option value="detailed">
                        Registro detalhado com contexto
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">
                    Principais Desafios
                  </label>
                  <div class="space-y-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [(ngModel)]="evolutionTracker.challenges.discipline"
                        (change)="calculateEvolution()"
                        class="w-4 h-4 bg-[#1b2330] border-[#2a3441] rounded text-[#22d3ee]"
                      />
                      <span class="text-sm">Falta de disciplina</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [(ngModel)]="evolutionTracker.challenges.emotional"
                        (change)="calculateEvolution()"
                        class="w-4 h-4 bg-[#1b2330] border-[#2a3441] rounded text-[#22d3ee]"
                      />
                      <span class="text-sm">Controle emocional</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [(ngModel)]="evolutionTracker.challenges.consistency"
                        (change)="calculateEvolution()"
                        class="w-4 h-4 bg-[#1b2330] border-[#2a3441] rounded text-[#22d3ee]"
                      />
                      <span class="text-sm">Falta de consistência</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [(ngModel)]="evolutionTracker.challenges.analysis"
                        (change)="calculateEvolution()"
                        class="w-4 h-4 bg-[#1b2330] border-[#2a3441] rounded text-[#22d3ee]"
                      />
                      <span class="text-sm">Análise de desempenho</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Results -->
              <div
                class="bg-gradient-to-br from-[#22d3ee]/10 to-[#f59e0b]/10 rounded-xl p-6"
              >
                <h3 class="text-lg font-semibold mb-4">
                  Sua Jornada com TradingNoteX
                </h3>

                <div class="space-y-4">
                  <!-- Discipline Score -->
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-gray-400">Disciplina</span>
                      <span class="text-sm font-bold text-[#10b981]">
                        +{{ evolutionTracker.improvements.discipline }}%
                      </span>
                    </div>
                    <div class="w-full bg-[#1b2330] rounded-full h-2">
                      <div
                        class="bg-gradient-to-r from-[#10b981] to-[#22d3ee] h-2 rounded-full transition-all duration-500"
                        [style.width.%]="
                          evolutionTracker.improvements.discipline
                        "
                      ></div>
                    </div>
                  </div>

                  <!-- Emotional Control -->
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-gray-400">Controle Emocional</span>
                      <span class="text-sm font-bold text-[#22d3ee]">
                        +{{ evolutionTracker.improvements.emotional }}%
                      </span>
                    </div>
                    <div class="w-full bg-[#1b2330] rounded-full h-2">
                      <div
                        class="bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] h-2 rounded-full transition-all duration-500"
                        [style.width.%]="
                          evolutionTracker.improvements.emotional
                        "
                      ></div>
                    </div>
                  </div>

                  <!-- Pattern Recognition -->
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-gray-400"
                        >Reconhecimento de Padrões</span
                      >
                      <span class="text-sm font-bold text-[#f59e0b]">
                        +{{ evolutionTracker.improvements.patterns }}%
                      </span>
                    </div>
                    <div class="w-full bg-[#1b2330] rounded-full h-2">
                      <div
                        class="bg-gradient-to-r from-[#f59e0b] to-[#d97706] h-2 rounded-full transition-all duration-500"
                        [style.width.%]="evolutionTracker.improvements.patterns"
                      ></div>
                    </div>
                  </div>

                  <!-- Time to Proficiency -->
                  <div class="mt-6 p-4 bg-[#10b981]/20 rounded-lg">
                    <p class="text-sm font-semibold text-[#10b981] mb-2">
                      Tempo estimado para proficiência:
                    </p>
                    <p class="text-2xl font-bold text-white">
                      {{ evolutionTracker.timeToProf }} meses
                    </p>
                    <p class="text-xs text-gray-400 mt-2">
                      * Com uso consistente da plataforma e aplicação das
                      métricas
                    </p>
                  </div>
                </div>

                <div class="mt-6 p-4 bg-[#22d3ee]/10 rounded-lg">
                  <p class="text-sm text-gray-300">
                    💡 <strong>Lembre-se:</strong> O sucesso no trading não vem
                    de promessas de lucro fácil, mas da construção gradual de
                    disciplina, conhecimento e controle emocional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 5) ÊNFASE: IA & TraderQuest -->
      <section class="py-20 px-4" id="ia-traderquest">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              IA que analisa. TraderQuest que transforma.
            </h2>
            <p class="text-gray-400 text-lg">
              A
              <span class="text-[#22d3ee] font-semibold">Análise com IA</span>
              identifica padrões, erros recorrentes e gatilhos. A
              <span class="text-[#f59e0b] font-semibold">TraderQuest</span>
              gamifica sua rotina com metas, níveis e conquistas.
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <!-- Bloco IA -->
            <div
              class="bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-8"
            >
              <div
                class="w-14 h-14 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] flex items-center justify-center mb-4"
              >
                <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3v18M3 12h18"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2">Análise com IA</h3>
              <ul class="space-y-2 text-sm text-gray-300">
                <li class="flex gap-2">
                  <span class="text-[#10b981]">●</span> Insights sobre
                  disciplina e emoções
                </li>
                <li class="flex gap-2">
                  <span class="text-[#10b981]">●</span> Padrões por contexto,
                  horário e setup
                </li>
                <li class="flex gap-2">
                  <span class="text-[#10b981]">●</span> Recomendações de
                  melhoria contínua
                </li>
              </ul>
            </div>

            <!-- Bloco TraderQuest -->
            <div
              class="bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-8"
            >
              <div
                class="w-14 h-14 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] flex items-center justify-center mb-4"
              >
                <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7l3-7z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2">TraderQuest (gamificação)</h3>
              <ul class="space-y-2 text-sm text-gray-300">
                <li class="flex gap-2">
                  <span class="text-[#10b981]">●</span> Níveis, XP e conquistas
                  por hábitos
                </li>
                <li class="flex gap-2">
                  <span class="text-[#10b981]">●</span> Metas semanais e trilhas
                  de evolução
                </li>
                <li class="flex gap-2">
                  <span class="text-[#10b981]">●</span> Reforço positivo para
                  consistência
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- 6) PREÇOS (Quanto vale o investimento) -->
      <section id="pricing" class="py-20 px-4 relative">
        <div
          class="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f131a]/50 to-transparent"
        ></div>

        <div class="max-w-6xl mx-auto relative z-10">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              Quanto vale o investimento?
            </h2>
            <p class="text-gray-400 text-lg mb-8">
              Escolha o plano ideal para sua jornada
            </p>

            <!-- Billing Toggle -->
            <div
              class="inline-flex items-center bg-[#1b2330]/80 backdrop-blur rounded-xl p-1.5"
            >
              <button
                (click)="setBilling('monthly')"
                class="relative px-6 py-3 rounded-lg font-medium transition-all duration-300"
                [ngClass]="
                  billingCycle === 'monthly' ? 'text-black' : 'text-gray-400'
                "
              >
                <span class="relative z-10">Mensal</span>
                <div
                  *ngIf="billingCycle === 'monthly'"
                  class="absolute inset-0 bg-gradient-to-r from-[#22d3ee] to-[#10b981] rounded-lg"
                ></div>
              </button>
              <button
                (click)="setBilling('yearly')"
                class="relative px-6 py-3 rounded-lg font-medium transition-all duration-300"
                [ngClass]="
                  billingCycle === 'yearly' ? 'text-black' : 'text-gray-400'
                "
              >
                <span class="relative z-10">Anual</span>
                <span
                  *ngIf="billingCycle === 'yearly'"
                  class="absolute -top-3 -right-2 bg-[#10b981] text-black text-xs px-2 py-0.5 rounded-full font-bold animate-pulse"
                >
                  -20%
                </span>
                <div
                  *ngIf="billingCycle === 'yearly'"
                  class="absolute inset-0 bg-gradient-to-r from-[#22d3ee] to-[#10b981] rounded-lg"
                ></div>
              </button>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-8 items-stretch">
            <!-- Basic Plan -->
            <div class="relative group">
              <div
                class="h-full bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-8 flex flex-col hover:border-[#22d3ee]/30 transition-all duration-300"
              >
                <div class="mb-6">
                  <h3 class="text-2xl font-bold mb-2">Basic</h3>
                  <p class="text-gray-400">Comece sua jornada</p>
                </div>

                <div class="mb-8">
                  <div class="flex items-baseline">
                    <span class="text-5xl font-bold">€0</span>
                    <span class="text-gray-400 ml-2">/sempre</span>
                  </div>
                </div>

                <ul class="space-y-4 mb-8 flex-1">
                  <li class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-[#10b981] shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>100 trades por mês</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-[#10b981] shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Métricas básicas</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-[#10b981] shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>1 conta de trading</span>
                  </li>
                  <li class="flex items-start gap-3 opacity-50">
                    <svg
                      class="w-5 h-5 text-gray-500 shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Sem análise avançada</span>
                  </li>
                </ul>

                <button
                  (click)="go('/register')"
                  class="w-full py-3 bg-[#1b2330] rounded-xl font-semibold hover:bg-[#2a3441] transition-all duration-300"
                >
                  Começar Grátis
                </button>
              </div>
            </div>

            <!-- Premium Plan - Featured -->
            <div class="relative group transform md:scale-105">
              <div
                class="absolute -inset-1 bg-gradient-to-r from-[#22d3ee] via-[#10b981] to-[#f59e0b] rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-300"
              ></div>
              <div
                class="relative h-full bg-[#0f131a] rounded-2xl p-8 flex flex-col"
              >
                <div class="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span
                    class="bg-gradient-to-r from-[#f59e0b] to-[#22d3ee] text-black text-sm px-4 py-1.5 rounded-full font-bold"
                  >
                    RECOMENDADO
                  </span>
                </div>

                <div class="mb-6 mt-2">
                  <h3 class="text-2xl font-bold mb-2">Premium</h3>
                  <p class="text-gray-400">Para traders sérios</p>
                </div>

                <div class="mb-8">
                  <div class="flex items-baseline">
                    <span
                      class="text-5xl font-bold text-transparent bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] bg-clip-text"
                    >
                      €{{ pricePremium() }}
                    </span>
                    <span class="text-gray-400 ml-2">/mês</span>
                  </div>
                  <div
                    *ngIf="billingCycle === 'yearly'"
                    class="text-sm text-[#10b981] mt-1"
                  >
                    Economize €24/ano
                  </div>
                </div>

                <ul class="space-y-4 mb-8 flex-1">
                  <li class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    <span class="font-medium">Trades ilimitados</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    <span class="font-medium">Análise de padrões com IA</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    <span class="font-medium">5 contas de trading</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    <span class="font-medium"
                      >Sistema de evolução gamificado</span
                    >
                  </li>
                  <li class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
                    <span class="font-medium"
                      >Métricas profissionais completas</span
                    >
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
                  class="w-full py-4 bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] text-black rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-[#22d3ee]/30 transform hover:scale-105 transition-all duration-300"
                >
                  Começar Jornada Pro →
                </button>
                <p class="text-xs text-center text-gray-400 mt-3">
                  7 dias grátis • Cancele quando quiser
                </p>
              </div>
            </div>

            <!-- Pro Plan -->
            <div class="relative group">
              <div
                class="h-full bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-2xl p-8 flex flex-col hover:border-[#8b5cf6]/30 transition-all duration-300"
              >
                <div class="mb-6">
                  <h3 class="text-2xl font-bold mb-2">Pro</h3>
                  <p class="text-gray-400">Para institucionais</p>
                </div>

                <div class="mb-8">
                  <div class="flex items-baseline">
                    <span class="text-5xl font-bold">€29</span>
                    <span class="text-gray-400 ml-2">/mês</span>
                  </div>
                </div>

                <ul class="space-y-4 mb-8 flex-1">
                  <li class="flex items-start gap-3">
                    <div
                      class="w-5 h-5 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <span class="text-white text-xs">♦</span>
                    </div>
                    <span>Tudo do Premium</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div
                      class="w-5 h-5 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <span class="text-white text-xs">♦</span>
                    </div>
                    <span>Análise ilimitada com IA</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div
                      class="w-5 h-5 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <span class="text-white text-xs">♦</span>
                    </div>
                    <span>Contas ilimitadas</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div
                      class="w-5 h-5 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <span class="text-white text-xs">♦</span>
                    </div>
                    <span>API access</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div
                      class="w-5 h-5 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded flex items-center justify-center shrink-0 mt-0.5"
                    >
                      <span class="text-white text-xs">♦</span>
                    </div>
                    <span>Mentoria e suporte prioritário</span>
                  </li>
                </ul>

                <button
                  (click)="handleCheckout('pro_monthly')"
                  class="w-full py-3 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-[#8b5cf6]/30 transform hover:scale-105 transition-all duration-300"
                >
                  Fale Conosco
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 7) FAQ (POR ÚLTIMO) -->
      <section class="py-20 px-4" id="faq">
        <div class="max-w-3xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              Perguntas frequentes
            </h2>
            <p class="text-gray-400 text-lg">
              Tire suas dúvidas sobre a plataforma
            </p>
          </div>

          <div class="space-y-4">
            <div
              *ngFor="let faq of faqs; let i = index"
              class="bg-[#0f131a]/80 backdrop-blur border border-[#1b2330] rounded-xl overflow-hidden hover:border-[#22d3ee]/30 transition-all duration-300"
            >
              <button
                (click)="toggleFaq(i)"
                class="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-[#1b2330]/30 transition-colors"
              >
                <span class="font-semibold pr-4">{{ faq.q }}</span>
                <svg
                  class="w-5 h-5 shrink-0 transition-transform duration-300"
                  [ngClass]="activeFaq === i ? 'rotate-180' : ''"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                *ngIf="activeFaq === i"
                class="px-6 pb-5 text-gray-400 animate-fadeIn"
              >
                {{ faq.a }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="py-12 px-4 border-t border-[#1b2330]">
        <div class="max-w-7xl mx-auto">
          <div class="grid md:grid-cols-5 gap-8">
            <!-- Brand -->
            <div class="md:col-span-2">
              <div class="flex items-center gap-2 mb-4">
                <span
                  class="text-2xl font-bold bg-gradient-to-r from-[#22d3ee] to-[#f59e0b] bg-clip-text text-transparent"
                >
                  TradingNoteX
                </span>
              </div>
              <p class="text-gray-400 text-sm mb-4">
                Transformando traders através de disciplina, análise e
                desenvolvimento profissional contínuo.
              </p>
              <div class="flex gap-4">
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition-colors"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M24 12.073c0-6.627-5.373-1 a 12 12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition-colors"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition-colors"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      @keyframes float {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-20px);
        }
      }
      @keyframes float-delayed {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-30px);
        }
      }
      @keyframes spin-slow {
        from {
          transform: translate(-50%, -50%) rotate(0deg);
        }
        to {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
      @keyframes gradient {
        0%,
        100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
      }
      @keyframes draw-line {
        to {
          stroke-dashoffset: 0;
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes scroll {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(calc(-350px * 6));
        }
      }

      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      .animate-float-delayed {
        animation: float-delayed 8s ease-in-out infinite;
      }
      .animate-spin-slow {
        animation: spin-slow 20s linear infinite;
      }
      .animate-gradient {
        background-size: 200% 200%;
        animation: gradient 3s ease infinite;
      }
      .animate-draw-line {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation: draw-line 2s ease forwards;
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease;
      }
      .animate-scroll {
        animation: scroll 30s linear infinite;
      }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #0f131a;
      }
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #22d3ee, #f59e0b);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #22d3ee;
      }

      /* Range input styling */
      input[type='range'] {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
      }
      input[type='range']::-webkit-slider-track {
        background: linear-gradient(to right, #22d3ee, #10b981, #f59e0b);
        height: 4px;
        border-radius: 2px;
      }
      input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        background: white;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        border: 2px solid #22d3ee;
        box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
        margin-top: -8px; /* centraliza no trilho */
      }

      /* Firefox */
      input[type='range']::-moz-range-track {
        background: linear-gradient(to right, #22d3ee, #10b981, #f59e0b);
        height: 4px;
        border-radius: 2px;
      }
      input[type='range']::-moz-range-thumb {
        background: white;
        height: 20px;
        width: 20px;
        border: 2px solid #22d3ee;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
      }
    `,
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  // ✅ Disponibiliza Math para o template ({{ Math.floor(...) }})
  public Math = Math;
  public activeFaq: number | null = null;
  // --- SEU ESTADO EXISTENTE (mantenha o que você já tinha) ---
  isScrolled = false;
  mobileMenuOpen = false;
  scrollProgress = 0;
  showScrollTop = false;

  currentHeadlineIndex = 0;
  private headlineIntervalId?: any;

  currentScreenIndex = 0;
  private screenIntervalId?: any;

  chartPoints = '';

  animatedStats = { trades: 0, discipline: 0, users: 0, rating: 0 };
  private statsTargets = {
    trades: 12,
    discipline: 32,
    users: 800,
    rating: 4.9,
  };
  private statsAnimId?: number;

  onlineUsers = 127;
  billingCycle: BillingCycle = 'monthly';

  menuItems = [
    { id: 'features', label: 'Recursos' },
    { id: 'pricing', label: 'Preços' },
    { id: 'testimonials', label: 'Depoimentos' },
  ];

  public faqs = [
    {
      q: 'Vocês oferecem sinais?',
      a: 'Não. O TradingNoteX é uma ferramenta educacional focada em análise e disciplina, sem sinais ou promessas de lucro.',
    },
    {
      q: 'Preciso de cartão para o teste?',
      a: 'Não. Você pode testar 7 dias sem cartão e cancelar quando quiser.',
    },
    {
      q: 'A análise com IA é ilimitada?',
      a: 'No plano Premium há limites generosos; no Pro é ilimitada.',
    },
    {
      q: 'Posso integrar várias contas?',
      a: 'Sim. Premium suporta até 5 contas; Pro é ilimitado.',
    },
  ];

  appScreens = [
    {
      url: 'assets/screens/screen1.jpg',
      title: 'Dashboard de Insights',
      description: 'Visualize desempenho e padrões de operação.',
    },
    {
      url: 'assets/screens/screen2.jpg',
      title: 'Registro Detalhado',
      description: 'Documente contexto, emoções e justificativas.',
    },
    {
      url: 'assets/screens/screen3.jpg',
      title: 'Métricas Profissionais',
      description: 'KPIs claros para evolução constante.',
    },
  ];

  evolutionTracker = {
    experience: 6,
    currentTracking: 'sometimes' as 'none' | 'sometimes' | 'basic' | 'detailed',
    challenges: {
      discipline: true,
      emotional: false,
      consistency: true,
      analysis: false,
    },
    improvements: { discipline: 0, emotional: 0, patterns: 0 },
    timeToProf: 0,
  };

  testimonials = [
    {
      name: 'Marcos A.',
      initials: 'MA',
      role: 'Swing Trader',
      quote: 'Passei a respeitar meu plano e reduzir overtrading.',
      improvement: '+28% disciplina',
      gradient: 'bg-gradient-to-r from-[#22d3ee] to-[#10b981]',
    },
    {
      name: 'Bianca R.',
      initials: 'BR',
      role: 'Day Trader',
      quote: 'Entendi meus gatilhos emocionais e cortei erros repetidos.',
      improvement: '+19% consistência',
      gradient: 'bg-gradient-to-r from-[#10b981] to-[#3b82f6]',
    },
    {
      name: 'Edu S.',
      initials: 'ES',
      role: 'Futuros',
      quote: 'Minhas notas viraram uma base sólida para evolução.',
      improvement: '+34% padrões',
      gradient: 'bg-gradient-to-r from-[#f59e0b] to-[#d97706]',
    },
  ];
  testimonialsLoop = [...this.testimonials, ...this.testimonials];

  // ✅ ADIÇÃO 1: mainFeatures para o *ngFor do grid de features
  mainFeatures = [
    {
      gradient: 'bg-gradient-to-r from-[#22d3ee] to-[#3b82f6]',
      icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 7h18M3 12h12M3 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
      title: 'Registro Estruturado',
      description: 'Anote contexto, setup, emoções e gestão de risco.',
      items: [
        'Templates de trade e tags',
        'Upload de imagens',
        'Notas rápidas e avançadas',
      ],
    },
    {
      gradient: 'bg-gradient-to-r from-[#10b981] to-[#059669]',
      icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M11 19l-7-7 1.5-1.5L11 16l7.5-7.5L20 10l-9 9z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
      title: 'Análise Profissional',
      description: 'KPIs e painéis para acompanhar sua evolução.',
      items: [
        'Winrate por contexto',
        'Erro recorrente e gatilhos',
        'Hora/dia com melhor performance',
      ],
    },
    {
      gradient: 'bg-gradient-to-r from-[#f59e0b] to-[#d97706]',
      icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 6v12m-6-6h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
      title: 'Disciplina & Rotina',
      description: 'Transforme insights em hábitos consistentes.',
      items: [
        'Checklist pré-mercado',
        'Regras pessoais e limites',
        'Trilhas gamificadas de evolução',
      ],
    },
  ];

  // ✅ ADIÇÃO 2: quickFeatures para o grid rápido
  quickFeatures = [
    { emoji: '🧠', label: 'Psicologia do Trading' },
    { emoji: '📈', label: 'Métricas em Tempo' },
    { emoji: '📝', label: 'Jornal de Trades' },
    { emoji: '🎯', label: 'Metas Semanais' },
    { emoji: '🧩', label: 'Padrões Pessoais' },
    { emoji: '⏱️', label: 'Rotinas Rápidas' },
    { emoji: '🔒', label: 'Privacidade & SSL' },
    { emoji: '🤝', label: 'Comunidade' },
  ];

  // --- MÉTODOS (mantenha os que você já tinha; seguem os essenciais) ---
  ngOnInit(): void {
    this.generateChartPoints();
    this.startHeadlineCarousel();
    this.startScreenCarousel();
    this.animateStats();
    this.calculateEvolution();
  }

  ngOnDestroy(): void {
    if (this.headlineIntervalId) clearInterval(this.headlineIntervalId);
    if (this.screenIntervalId) clearInterval(this.screenIntervalId);
    if (this.statsAnimId) cancelAnimationFrame(this.statsAnimId);
  }

  @HostListener('window:scroll') onScroll(): void {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    this.isScrolled = y > 10;
    this.showScrollTop = y > 300;
    const docHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    this.scrollProgress =
      docHeight > 0 ? Math.min(100, Math.max(0, (y / docHeight) * 100)) : 0;
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setBilling(mode: BillingCycle): void {
    this.billingCycle = mode;
  }
  pricePremium(): number {
    return this.billingCycle === 'monthly' ? 9 : 7;
  }

  handleCheckout(plan: string): void {
    console.log('Checkout:', plan);
  }
  openInteractiveDemo(): void {
    console.log('Open interactive demo');
  }
  go(path: string): void {
    window.location.href = path;
  }

  setCurrentScreen(i: number): void {
    this.currentScreenIndex = i;
  }

  private startHeadlineCarousel(): void {
    this.headlineIntervalId = setInterval(() => {
      this.currentHeadlineIndex = (this.currentHeadlineIndex + 1) % 3;
    }, 4000);
  }
  private startScreenCarousel(): void {
    this.screenIntervalId = setInterval(() => {
      this.currentScreenIndex =
        (this.currentScreenIndex + 1) % this.appScreens.length;
    }, 4500);
  }

  private generateChartPoints(): void {
    const width = 1440,
      height = 800,
      steps = 120;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const base = Math.sin(i * 0.25) * 120 + Math.sin(i * 0.07) * 60;
      const y = height / 2 - base - 20;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    this.chartPoints = pts.join(' ');
  }

  // private statsAnimId?: number;
  private animateStats(): void {
    const start = { trades: 0, discipline: 0, users: 0, rating: 0 };
    const end = this.statsTargets;
    const duration = 1200;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      this.animatedStats.trades = Math.round(
        start.trades + (end.trades - start.trades) * p
      );
      this.animatedStats.discipline = Math.round(
        start.discipline + (end.discipline - start.discipline) * p
      );
      this.animatedStats.users = Math.round(
        start.users + (end.users - start.users) * p
      );
      const r = start.rating + (end.rating - start.rating) * p;
      this.animatedStats.rating = Math.round(r * 10) / 10;
      if (p < 1) this.statsAnimId = requestAnimationFrame(step);
    };
    this.statsAnimId = requestAnimationFrame(step);
  }

  calculateEvolution(): void {
    const exp = this.evolutionTracker.experience;
    const trackingWeights = {
      none: 0,
      sometimes: 0.4,
      basic: 0.7,
      detailed: 1,
    } as const;
    const base = trackingWeights[this.evolutionTracker.currentTracking];
    const ch = this.evolutionTracker.challenges;
    const challengeBoost =
      (ch.discipline ? 0.25 : 0) +
      (ch.emotional ? 0.2 : 0) +
      (ch.consistency ? 0.2 : 0) +
      (ch.analysis ? 0.15 : 0);

    const disc = Math.min(
      100,
      Math.round(base * 45 + challengeBoost * 35 - (exp > 24 ? 5 : 0))
    );
    const emo = Math.min(
      100,
      Math.round(base * 35 + (ch.emotional ? 20 : 10) + challengeBoost * 20)
    );
    const patt = Math.min(
      100,
      Math.round(base * 40 + (ch.analysis ? 20 : 10) + challengeBoost * 15)
    );

    this.evolutionTracker.improvements = {
      discipline: Math.max(0, disc),
      emotional: Math.max(0, emo),
      patterns: Math.max(0, patt),
    };

    const baseMonths = 18;
    const reduction = Math.min(
      10,
      Math.round(base * 8 + challengeBoost * 4 - exp / 12)
    );
    this.evolutionTracker.timeToProf = Math.max(3, baseMonths - reduction);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 768 && this.mobileMenuOpen)
      this.mobileMenuOpen = false;
  }

  setCurrentHeadline(idx: number): void {
    this.currentHeadlineIndex = idx % 3;
  }
}
