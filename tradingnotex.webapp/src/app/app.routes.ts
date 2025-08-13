import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Partials } from './partials/partials';
import { RiskComponent } from './risk/risk';
import { EvolutionComponent } from './evolution/evolution';
import { AchievementsComponent } from './achievements/achievements';
import { TradeDetail } from './trade-detail/trade-detail';
import { TradeMaintenance } from './trade-maintenance/trade-maintenance';
import { TraderQuestComponent } from './trader-quest/trader-quest.component';
import { Logout } from './logout/logout';
import { authGuard } from './auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'partials', component: Partials, canActivate: [authGuard] },
  { path: 'risk', component: RiskComponent, canActivate: [authGuard] },
  { path: 'evolution', component: EvolutionComponent, canActivate: [authGuard] },
   { path: 'quest', component: TraderQuestComponent },
  { path: 'achievements', component: AchievementsComponent, canActivate: [authGuard] },
  { path: 'trade/:id', component: TradeDetail, canActivate: [authGuard] },
  { path: 'trade-maintenance', component: TradeMaintenance, canActivate: [authGuard] },
  { path: 'logout', component: Logout },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
