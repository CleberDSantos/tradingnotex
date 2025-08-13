import { Injectable } from '@angular/core';
import { TradeService, Trade, KPIsResponse, HourlyHeatmapResponse } from './trade.service';
import { map } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';

export type Pillar = 'tech'|'risk'|'emotion'|'discipline';

export interface QuestSummary {
  player: {
    name: string;
    level: number;
    totalXP: number;
    currentXP: number;
    requiredXP: number;
    pillars: Record<Pillar, number>;
  };
  stats: KPIsResponse & {
    currentStreak: number;
    bestStreak: number;
    consistentDays: number;
  };
  heatmap: HourlyHeatmapResponse;
  achievementsUnlocked: number[];
  daily: {
    analysisCompleted: number; // hoje
    analysisTarget: number;    // 3
    winRateToday: number;      // 0..1
    winRateTarget: number;     // 0.60
    dailyLossReached: boolean; // hoje
  };
}

@Injectable({ providedIn: 'root' })
export class QuestService {

  constructor(private trades: TradeService) {}

  // ---------- Regras ----------
  private requiredXP(level: number): number {
    return 100*level + 10*level*level; // suave e crescente
  }

  private rankLevelFromXP(totalXP: number): { level: number; currentXP: number; requiredXP: number } {
    let level = 1;
    let curXP = totalXP;
    let req = this.requiredXP(level);
    while (curXP >= req && level < 100) {
      curXP -= req;
      level++;
      req = this.requiredXP(level);
    }
    return { level, currentXP: curXP, requiredXP: req };
  }

  private xpForTrade(t: Trade, bestHour?: number): number {
    // Base 10 XP
    let xp = 10;

    // Vitória (+10), Derrota (+0)
    if ((t.realizedPLEUR ?? 0) > 0) xp += 10;

    // Trade analisado (comments>0) (+10)
    if (Array.isArray(t.comments) && t.comments.length > 0) xp += 10;

    // Bônus melhor hora (+5)
    try {
      const h = new Date(t.executedAtUTC).getUTCHours();
      if (bestHour !== undefined && h === bestHour) xp += 5;
    } catch {}

    // Penalidade violar perda diária (-20)
    if (t.dailyLossReached) xp -= 20;

    return Math.max(0, xp);
  }

  private calcPillars(k: KPIsResponse, dayAgg: { violations: number; tradesPerDayAvg: number }): Record<Pillar, number> {
    // Helpers de normalização
    const clamp = (v: number, a=0, b=100) => Math.max(a, Math.min(b, v));
    const norm = (x: number, min: number, max: number) => {
      if (max === min) return 0;
      return clamp(((x - min) / (max - min)) * 100);
    };

    // Tech: winRate (0–100) + expectancy (-2..2 -> 0..100) com pesos
    const tech = clamp(0.6*(k.winRate) + 0.4*norm(k.expectancy, -2, 2));

    // Risk: menor drawdown e menor maxLoss são melhores
    const risk = clamp(100 - 0.6*norm(k.drawdown, 0, 50) - 0.4*norm(Math.abs(k.maxLoss), 0, 10));

    // Emotion: base neutra 50, sobe com consistência (expectancy>0) e cai com clusters (aprox. por violations)
    const emotion = clamp(50 + 0.4*norm(k.expectancy, -1, 1) - 0.6*norm(dayAgg.violations, 0, 5));

    // Discipline: penaliza overtrading e violações de perda diária
    const discipline = clamp(100 - 0.5*norm(dayAgg.tradesPerDayAvg, 0, 20) - 0.5*norm(dayAgg.violations, 0, 5));

    return { tech, risk, emotion, discipline };
  }

  private computeStreaks(trades: Trade[]): { current: number; best: number } {
    // Considera ordem cronológica crescente
    const arr = [...trades].sort((a,b)=> new Date(a.executedAtUTC).getTime()-new Date(b.executedAtUTC).getTime());
    let cur = 0, best = 0;
    for (const t of arr) {
      const win = (t.realizedPLEUR ?? 0) > 0;
      if (win) {
        cur++;
        best = Math.max(best, cur);
      } else {
        cur = 0;
      }
    }
    return { current: cur, best };
  }

  private consistentDays(trades: Trade[]): number {
    // Conta dias com P&L diário > 0 consecutivos até hoje
    const byDay: Record<string, number> = {};
    for (const t of trades) {
      const d = new Date(t.executedAtUTC);
      const key = d.toISOString().slice(0,10); // YYYY-MM-DD UTC
      byDay[key] = (byDay[key] ?? 0) + (t.realizedPLEUR ?? 0);
    }
    const days = Object.keys(byDay).sort();
    let cur = 0;
    for (let i = days.length-1; i>=0; i--) {
      const pl = byDay[days[i]];
      if (pl > 0) cur++;
      else break;
    }
    return cur;
  }

  private achievementsFromData(allTrades: Trade[], heat: HourlyHeatmapResponse): number[] {
    const unlocked: number[] = [];
    const totalTrades = allTrades.length;

    // Helpers
    const sum = (xs: number[]) => xs.reduce((a,b)=>a+b,0);

    // Lucros totais (EUR)
    const totalPL = sum(allTrades.map(t => t.realizedPLEUR ?? 0));

    // Streaks
    const { best } = this.computeStreaks(allTrades);

    // Early/Late counts via hora UTC (ajuste se quiser usar TZ local)
    let early = 0, late = 0;
    for (const t of allTrades) {
      const h = new Date(t.executedAtUTC).getUTCHours();
      if (h < 10) early++;
      if (h >= 20) late++;
    }

    // 🔓 Conquistas que conseguimos derivar hoje:
    if (totalTrades >= 1) unlocked.push(13);       // Primeiro Trade
    if (totalTrades >= 100) unlocked.push(14);     // 100 trades
    if (totalTrades >= 1000) unlocked.push(15);    // 1000 trades
    if (best >= 3) unlocked.push(16);              // Lucky 3
    if (best >= 5) unlocked.push(17);              // Hot Hand
    if (best >= 10) unlocked.push(18);             // Imparável
    if (totalPL >= 100) unlocked.push(19);         // €100 lucro
    if (totalPL >= 1000) unlocked.push(20);        // €1000 lucro
    if (totalPL >= 10000) unlocked.push(21);       // €10000 lucro
    if (early >= 10) unlocked.push(22);            // Early Bird
    if (late >= 10) unlocked.push(23);             // Night Owl
    // 24 (Lendário) depende de level 100 — liberado pelo level

    // As conquistas de Tech/Risk/Emotion/Discipline que dependem de:
    // - analysisCompleted, usedStop, R:R >= 1:2, bigLoss avoided, revenge-free days etc.
    // Só destravaremos quando esses campos existirem. (Você já definiu "analisado" via comments>0 — isso ajuda nas missões e Tech.)

    return unlocked;
  }

  private todayStats(trades: Trade[]) {
    const today = new Date().toISOString().slice(0,10);
    const todays = trades.filter(t => t.executedAtUTC.slice(0,10) === today);
    const wins = todays.filter(t => (t.realizedPLEUR ?? 0) > 0).length;
    const loss = todays.length - wins;
    const winRateToday = todays.length ? wins / todays.length : 0;
    const analysisCompleted = todays.filter(t => Array.isArray(t.comments) && t.comments.length > 0).length;
    const dailyLossReached = todays.some(t => t.dailyLossReached);
    return { todays, winRateToday, analysisCompleted, dailyLossReached };
  }

  private dayAgg(trades: Trade[]) {
    // médias por dia e violações
    const byDay: Record<string, { trades: number; violation: boolean }> = {};
    for (const t of trades) {
      const key = t.executedAtUTC.slice(0,10);
      byDay[key] ??= { trades: 0, violation: false };
      byDay[key].trades++;
      byDay[key].violation ||= !!t.dailyLossReached;
    }
    const days = Object.values(byDay);
    const tradesPerDayAvg = days.length ? days.map(d => d.trades).reduce((a,b)=>a+b,0) / days.length : 0;
    const violations = days.filter(d => d.violation).length;
    return { tradesPerDayAvg, violations };
  }

  // ---------- API principal ----------
  loadSummary(startDate?: string, endDate?: string, displayName = 'Você'): Observable<QuestSummary> {
    const kpis$ = this.trades.getKPIs(startDate, endDate);
    const heat$ = this.trades.getHeatmap();
    const list$ = this.trades.list({ OrderBy: 'executedAtUTC asc', Limit: 2000 }).pipe(map(r => r.results || []));

    return combineLatest([kpis$, heat$, list$]).pipe(
      map(([kpis, heat, trades]) => {
        // XP total via soma de XP por trade
        const bestHour = heat?.bestHour?.hour;
        const totalXP = trades.map(t => this.xpForTrade(t, bestHour)).reduce((a,b)=>a+b, 0);
        const levelPack = this.rankLevelFromXP(totalXP);

        // Pilares a partir de KPIs e agregações por dia
        const pillars = this.calcPillars(kpis, this.dayAgg(trades));

        // Streaks e consistência
        const { current, best } = this.computeStreaks(trades);
        const consistent = this.consistentDays(trades);

        // Conquistas desbloqueáveis com seus dados
        const ach = this.achievementsFromData(trades, heat);
        if (levelPack.level >= 100 && !ach.includes(24)) ach.push(24); // Lendário

        // Missões de hoje
        const day = this.todayStats(trades);

        const summary: QuestSummary = {
          player: {
            name: displayName,
            level: levelPack.level,
            totalXP,
            currentXP: levelPack.currentXP,
            requiredXP: levelPack.requiredXP,
            pillars
          },
          stats: {
            ...kpis,
            currentStreak: current,
            bestStreak: best,
            consistentDays: consistent
          },
          heatmap: heat,
          achievementsUnlocked: ach,
          daily: {
            analysisCompleted: day.analysisCompleted,
            analysisTarget: 3,
            winRateToday: day.winRateToday,
            winRateTarget: 0.60,
            dailyLossReached: day.dailyLossReached
          }
        };

        return summary;
      })
    );
  }
}
