import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Partials } from './partials/partials';
import { RiskComponent } from './risk/risk';
import { EvolutionComponent } from './evolution/evolution';
import { AchievementsComponent } from './achievements/achievements';
import { Logout } from './logout/logout';
import { authGuard } from './auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'partials', component: Partials, canActivate: [authGuard] },
  { path: 'risk', component: RiskComponent, canActivate: [authGuard] },
  { path: 'evolution', component: EvolutionComponent, canActivate: [authGuard] },
  { path: 'achievements', component: AchievementsComponent, canActivate: [authGuard] },
  { path: 'logout', component: Logout },
  { path: '', redirectTo: '/login', pathMatch: 'full' } // Redireciona para login por padrão
];
