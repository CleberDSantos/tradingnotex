import { Component, AfterViewInit, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestService, QuestSummary } from '../services/quest.service';
type Pillar = 'tech' | 'risk' | 'emotion' | 'discipline';

interface Rank { min: number; max: number; name: string; color: string; icon: string; }
interface Achievement {
  id: number; name: string; desc: string; icon: string;
  pillar: 'tech'|'risk'|'emotion'|'discipline'|'general'|'streak'|'profit'|'special';
  xp: number; requirement: number;
}
interface PlayerState {
  level: number;
  currentXP: number;
  requiredXP: number;
  totalXP: number;
  techScore: number;
  riskScore: number;
  emotionScore: number;
  disciplineScore: number;
  totalTrades: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  consistentDays: number;
  totalProfit: number;
  unlockedAchievements: number[];
  dailyProgress: { trades: number; winRate: number; riskRespected: boolean; };
  name: string;
}

@Component({
  selector: 'app-trader-quest',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trader-quest.component.html',
  styleUrls: ['./trader-quest.component.scss']
})
export class TraderQuestComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('characterCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // ======= CONSTS =======
  readonly RANKS: Record<string, Rank> = {
    START: { min: 1, max: 20, name: 'Iniciante',     color: '#9ca3af', icon: '🌟' },
    PLUS:  { min: 21, max: 40, name: 'Trader Plus',  color: '#10b981', icon: '⭐' },
    PRO:   { min: 41, max: 60, name: 'Trader PRO',   color: '#3b82f6', icon: '💎' },
    ELITE: { min: 61, max: 80, name: 'Elite Trader', color: '#8b5cf6', icon: '👑' },
    ULTRA: { min: 81, max: 100, name: 'ULTRA Master',color: '#ec4899', icon: '🔥' }
  };

  dailyAnalysisCompleted = 0;  // 0..3
dailyWinRatePct = 0;         // 0..100
dailyLossHit = false;

  achievements: Achievement[] = [
    // Conhecimento Técnico
    { id: 1,  name: 'Estudioso',       desc: 'Complete 10 análises técnicas', icon: '📚', pillar: 'tech', xp: 100, requirement: 10 },
    { id: 2,  name: 'Analista',        desc: 'Complete 50 análises técnicas', icon: '📈', pillar: 'tech', xp: 250, requirement: 50 },
    { id: 3,  name: 'Expert Técnico',  desc: 'Complete 100 análises técnicas',icon: '🎓', pillar: 'tech', xp: 500, requirement: 100 },
    // Gestão de Risco
    { id: 4,  name: 'Cauteloso',       desc: 'Use stop loss em 10 trades',    icon: '🛡️', pillar: 'risk', xp: 100, requirement: 10 },
    { id: 5,  name: 'Risk Manager',    desc: 'Mantenha R:R acima de 1:2 por 30 trades', icon: '⚖️', pillar: 'risk', xp: 300, requirement: 30 },
    { id: 6,  name: 'Guardião',        desc: 'Evite 50 perdas grandes',       icon: '🏰', pillar: 'risk', xp: 500, requirement: 50 },
    // Controle Emocional
    { id: 7,  name: 'Zen',             desc: 'Mantenha calma em 5 trades perdidos', icon: '🧘', pillar: 'emotion', xp: 150, requirement: 5 },
    { id: 8,  name: 'Mestre Mental',   desc: 'Não revenge trade por 30 dias', icon: '🧠', pillar: 'emotion', xp: 400, requirement: 30 },
    { id: 9,  name: 'Inabalável',      desc: 'Supere um drawdown de 20%',     icon: '💪', pillar: 'emotion', xp: 600, requirement: 1 },
    // Disciplina
    { id: 10, name: 'Consistente',     desc: 'Trade por 7 dias seguidos',     icon: '📅', pillar: 'discipline', xp: 150, requirement: 7 },
    { id: 11, name: 'Dedicado',        desc: 'Trade por 30 dias seguidos',    icon: '🎯', pillar: 'discipline', xp: 350, requirement: 30 },
    { id: 12, name: 'Incansável',      desc: 'Trade por 100 dias seguidos',   icon: '🏆', pillar: 'discipline', xp: 750, requirement: 100 },
    // Marcos Gerais
    { id: 13, name: 'Primeiro Trade',  desc: 'Complete seu primeiro trade',   icon: '🎉', pillar: 'general', xp: 50, requirement: 1 },
    { id: 14, name: 'Centurião',       desc: 'Complete 100 trades',           icon: '💯', pillar: 'general', xp: 300, requirement: 100 },
    { id: 15, name: 'Veterano',        desc: 'Complete 1000 trades',          icon: '🎖️', pillar: 'general', xp: 1000, requirement: 1000 },
    // Win Streaks
    { id: 16, name: 'Lucky 3',         desc: '3 trades vencedores seguidos',  icon: '🍀', pillar: 'streak', xp: 100, requirement: 3 },
    { id: 17, name: 'Hot Hand',        desc: '5 trades vencedores seguidos',  icon: '🔥', pillar: 'streak', xp: 200, requirement: 5 },
    { id: 18, name: 'Imparável',       desc: '10 trades vencedores seguidos', icon: '⚡', pillar: 'streak', xp: 500, requirement: 10 },
    // Profit
    { id: 19, name: 'Primeiro Lucro',  desc: 'Ganhe seu primeiro €100',       icon: '💰', pillar: 'profit', xp: 100, requirement: 100 },
    { id: 20, name: 'Mil Euros',       desc: 'Acumule €1000 em lucros',       icon: '💎', pillar: 'profit', xp: 300, requirement: 1000 },
    { id: 21, name: 'Cinco Dígitos',   desc: 'Acumule €10000 em lucros',      icon: '🏦', pillar: 'profit', xp: 1000, requirement: 10000 },
    // Especiais
    { id: 22, name: 'Early Bird',      desc: 'Faça 10 trades antes das 10h',  icon: '🌅', pillar: 'special', xp: 150, requirement: 10 },
    { id: 23, name: 'Night Owl',       desc: 'Faça 10 trades após as 20h',    icon: '🦉', pillar: 'special', xp: 150, requirement: 10 },
    { id: 24, name: 'Lendário',        desc: 'Alcance o nível 100',           icon: '👑', pillar: 'special', xp: 2000, requirement: 100 }
  ];

  // ======= STATE =======
  player: PlayerState = {
    level: 6,
    currentXP: 122,
    requiredXP: 960,
    totalXP: 122,
    techScore: 7.824989009077424,
    riskScore: 7.5807560506605345,
    emotionScore: 4.396979767121611,
    disciplineScore: 5.434693618976395,
    totalTrades: 8,
    winRate: 53.1,
    currentStreak: 0,
    bestStreak: 0,
    consistentDays: 0,
    totalProfit: 0,
    unlockedAchievements: [24], // exemplo: Lendário desbloqueado
    dailyProgress: { trades: 0, winRate: 0, riskRespected: true },
    name: 'TraderPro'
  };

  resetTimer = '00:00:00';
  private timerId?: any;
  private simulateId?: any;

  constructor(private quest: QuestService) {}

  // ======= LIFECYCLE =======
ngOnInit(): void {
    // Carrega tudo da API
    this.quest.loadSummary().subscribe((s: QuestSummary) => {
      // Player & Level
      this.player.name = s.player.name;
      this.player.level = s.player.level;
      this.player.totalXP = s.player.totalXP;
      this.player.currentXP = s.player.currentXP;
      this.player.requiredXP = s.player.requiredXP;

      // Pilares
      this.player.techScore = s.player.pillars.tech;
      this.player.riskScore = s.player.pillars.risk;
      this.player.emotionScore = s.player.pillars.emotion;
      this.player.disciplineScore = s.player.pillars.discipline;

      // Stats
      this.player.totalTrades = s.stats.totalTrades;
      this.player.winRate = s.stats.winRate;
      this.player.currentStreak = s.stats.currentStreak;
      this.player.bestStreak = s.stats.bestStreak;
      this.player.consistentDays = s.stats.consistentDays;

      // Conquistas
      this.player.unlockedAchievements = s.achievementsUnlocked;

      this.dailyAnalysisCompleted = s.daily.analysisCompleted;
    this.dailyWinRatePct = s.daily.winRateToday * 100;
    this.dailyLossHit = s.daily.dailyLossReached;



      // Missões diárias (bindings no HTML)
      this.resetTimer = this.resetTimer; // continua com timer
      // Se quiser exibir progresso das 3 missões no HTML:
      //  - s.daily.analysisCompleted (de 3)
      //  - s.daily.winRateToday (vs 0.60)
      //  - s.daily.dailyLossReached (✓/✗)

      // Redesenhar personagem quando o level mudar
      this.drawCharacter(this.player.level);
    });

    // Timer do reset permanece
    this.updateDailyTimer();
    this.timerId = setInterval(() => this.updateDailyTimer(), 1000);
  }

  ngAfterViewInit(): void {
    this.drawCharacter(this.player.level);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
    if (this.simulateId) clearInterval(this.simulateId);
  }

  // ======= GETTERS (Bindings) =======
  get currentRank(): Rank {
    return this.getCurrentRank(this.player.level);
  }

  get xpPercent(): number {
    return this.player.requiredXP ? (this.player.currentXP / this.player.requiredXP) * 100 : 0;
  }

  get totalPowerScore(): number {
    const p = this.player;
    return p.techScore + p.riskScore + p.emotionScore + p.disciplineScore;
  }

  get unlockedCount(): number {
    return this.player.unlockedAchievements.length;
  }

  // ======= METHODS (antes eram funções soltas) =======
  calculateRequiredXP(level: number): number {
    return 100 * level + (level * level * 10);
  }

  getCurrentRank(level: number): Rank {
  for (const r of Object.values(this.RANKS)) {
    if (level >= r.min && level <= r.max) return r;
  }
  return this.RANKS['START'];
}

  getBonusLabel(pillar: Pillar, score: number): string {
    switch (pillar) {
      case 'tech':       return `+${Math.floor(score / 10)} XP/trade`;
      case 'risk':       return `+${Math.floor(score / 5)}% proteção`;
      case 'emotion':    return `+${Math.floor(score / 4)}% consistência`;
      case 'discipline': return `+${Math.floor(score / 5)}% win rate`;
    }
  }

  isUnlocked(a: Achievement): boolean {
    return this.player.unlockedAchievements.includes(a.id);
  }

  gainXP(amount: number): void {
    this.player.currentXP += amount;
    this.player.totalXP += amount;

    while (this.player.currentXP >= this.player.requiredXP) {
      this.player.currentXP -= this.player.requiredXP;
      this.player.level++;
      this.player.requiredXP = this.calculateRequiredXP(this.player.level);
      this.playLevelUpBadge();
      this.drawCharacter(this.player.level);
    }
  }

  playLevelUpBadge(): void {
    // animação CSS na badge
    const badge = document.querySelector('.level-badge');
    if (!badge) return;
    badge.classList.add('animate-level-up');
    setTimeout(() => badge.classList.remove('animate-level-up'), 1000);
  }

  simulateProgress(): void {
    // Simulações para demo
    this.player.totalTrades++;
    this.player.winRate = 50 + Math.random() * 30;
    this.player.techScore       = Math.min(100, this.player.techScore + Math.random() * 2);
    this.player.riskScore       = Math.min(100, this.player.riskScore + Math.random() * 1.5);
    this.player.emotionScore    = Math.min(100, this.player.emotionScore + Math.random() * 1);
    this.player.disciplineScore = Math.min(100, this.player.disciplineScore + Math.random() * 1.8);

    this.gainXP(10 + Math.floor(Math.random() * 30));

    if (Math.random() > 0.9) {
      const locked = this.achievements.filter(a => !this.isUnlocked(a));
      if (locked.length > 0) {
        const achievement = locked[Math.floor(Math.random() * locked.length)];
        this.player.unlockedAchievements.push(achievement.id);
        this.gainXP(achievement.xp);
      }
    }
  }

  updateDailyTimer(): void {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = +tomorrow - +now;
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    this.resetTimer = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  // ======= Canvas =======
  drawCharacter(level: number): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 64;
    canvas.height = 64;
    ctx.clearRect(0, 0, 64, 64);

    const px = 2;
    const rank = this.getCurrentRank(level);
    const skinColor = '#fdbcb4';
    const hairColor = '#8b4513';
    const shirtColor = rank.color;
    const pantsColor = '#1f2937';

    const character = [
      [0,0,1,1,1,1,0,0],
      [0,1,2,2,2,2,1,0],
      [0,2,3,2,2,3,2,0],
      [0,2,2,2,2,2,2,0],
      [0,0,4,4,4,4,0,0],
      [0,4,4,4,4,4,4,0],
      [0,5,5,0,0,5,5,0],
      [0,5,5,0,0,5,5,0],
    ];
    const colorMap: Record<number, string|null> = {
      0: null, 1: hairColor, 2: skinColor, 3: '#000000', 4: shirtColor, 5: pantsColor
    };

    character.forEach((row, y) => {
      row.forEach((pixel, x) => {
        if (pixel !== 0) {
          ctx.fillStyle = colorMap[pixel]!;
          ctx.fillRect(x * px * 4, y * px * 4, px * 4, px * 4);
        }
      });
    });

    if (level > 20) { // óculos
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(16, 16, 8, 2);
      ctx.fillRect(40, 16, 8, 2);
      ctx.fillRect(24, 16, 16, 2);
    }
    if (level > 40) { // gravata
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(30, 32, 4, 12);
    }
    if (level > 60) { // coroa
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(20, 4, 24, 4);
      ctx.fillRect(24, 0, 4, 8);
      ctx.fillRect(32, 0, 4, 8);
      ctx.fillRect(40, 0, 4, 8);
    }
    if (level > 80) { // aura
      ctx.shadowColor = rank.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.fillRect(0, 0, 64, 64);
      ctx.shadowBlur = 0;
    }
  }
}
