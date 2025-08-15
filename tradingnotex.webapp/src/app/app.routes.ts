import { Routes } from '@angular/router';
import { Login } from './login/login';
import { RegisterComponent } from './register/register.component';
import { Dashboard } from './dashboard/dashboard';
import { Partials } from './partials/partials';
import { RiskComponent } from './risk/risk';
import { EvolutionComponent } from './evolution/evolution';
import { AchievementsComponent } from './achievements/achievements';
import { TradeDetail } from './trade-detail/trade-detail';
import { TradeMaintenance } from './trade-maintenance/trade-maintenance';
import { TraderQuestComponent } from './trader-quest/trader-quest.component';
import { ProfileComponent } from './profile/profile.component';
import { AccountsComponent } from './account/accounts';
import { Logout } from './logout/logout';
import { userTypeGuard, premiumGuard, mentorAccessGuard, adminGuard } from './user-type.guard';
import { UserType } from './models/user.model';
import { UpgradeComponent } from './upgrade/upgrade.component';
import { HomeComponent } from './home/home.component';
import { authCanMatch } from './auth-can-match'; // ✅ novo

export const routes: Routes = [
  // 🔓 PÚBLICAS (SEM QUALQUER GUARD)
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },
  { path: 'logout', component: Logout },
  { path: 'link-expired', loadComponent: () => import('./errors/link-expired/link-expired.component').then(m => m.LinkExpiredComponent) },
  { path: 'invalid-link', loadComponent: () => import('./errors/invalid-link/invalid-link.component').then(m => m.InvalidLinkComponent) },

  // 🔒 PROTEGIDAS (parent com canMatch impede o match quando não há token)
  {
    path: '',
    canMatch: [authCanMatch], // ✅ só entra neste bloco se autenticado
    children: [
      { path: 'upgrade', component: UpgradeComponent },

      {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [userTypeGuard],
        data: { allowedUserTypes: [UserType.BASIC, UserType.PREMIUM, UserType.OWNER] }
      },
      {
        path: 'risk',
        component: RiskComponent,
        canActivate: [userTypeGuard],
        data: { allowedUserTypes: [UserType.BASIC, UserType.PREMIUM, UserType.OWNER] }
      },

      // Premium
      { path: 'evolution', component: EvolutionComponent, canActivate: [premiumGuard] },
      { path: 'quest', component: TraderQuestComponent, canActivate: [premiumGuard] },
      { path: 'partials', component: Partials, canActivate: [premiumGuard] },

      // Contas
      {
        path: 'accounts',
        component: AccountsComponent,
        data: { basicLimit: 1, premiumLimit: 5 }
      },

      // Trade detail (autenticado)
      { path: 'trade/:id', component: TradeDetail },

      // Trade compartilhado por token (pode ser público; se exigir login, mantenha aqui com canMatch removido)
      { path: 'shared/trade/:id', component: TradeDetail, canActivate: [mentorAccessGuard], data: { isMentorView: true } },

      // Conquistas
      { path: 'achievements', component: AchievementsComponent, canActivate: [premiumGuard] },

      // Perfil
      { path: 'profile', component: ProfileComponent },

      // Admin
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: 'users', loadComponent: () => import('./admin/user-management/user-management.component').then(m => m.UserManagementComponent) },
          { path: 'stats', loadComponent: () => import('./admin/system-stats/system-stats.component').then(m => m.SystemStatsComponent) },
          { path: 'settings', loadComponent: () => import('./admin/settings/settings.component').then(m => m.SettingsComponent) },
          { path: '', redirectTo: 'users', pathMatch: 'full' }
        ]
      },
    ]
  },

  // 404
  { path: '**', loadComponent: () => import('./errors/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
