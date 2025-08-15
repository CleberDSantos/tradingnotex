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
import { authGuard } from './auth-guard';
import { userTypeGuard, premiumGuard, aiFeatureGuard, mentorAccessGuard, adminGuard } from './user-type.guard';
import { UserType } from './models/user.model';
import { UpgradeComponent } from './upgrade/upgrade.component';

export const routes: Routes = [
  // Rotas públicas
  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },
  { path: 'logout', component: Logout },

  // Rota de upgrade
  {
    path: 'upgrade',
    component: UpgradeComponent,
    canActivate: [authGuard]
  },

  // Dashboard - disponível para todos os usuários autenticados exceto Mentor
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard, userTypeGuard],
    data: {
      allowedUserTypes: [UserType.BASIC, UserType.PREMIUM, UserType.OWNER]
    }
  },

  // Gestão de Risco - disponível para todos exceto Mentor
  {
    path: 'risk',
    component: RiskComponent,
    canActivate: [authGuard, userTypeGuard],
    data: {
      allowedUserTypes: [UserType.BASIC, UserType.PREMIUM, UserType.OWNER]
    }
  },

  // Funcionalidades Premium
  {
    path: 'evolution',
    component: EvolutionComponent,
    canActivate: [authGuard, premiumGuard]
  },

  {
    path: 'quest',
    component: TraderQuestComponent,
    canActivate: [authGuard, premiumGuard]
  },

  {
    path: 'partials',
    component: Partials,
    canActivate: [authGuard, premiumGuard]
  },

  // Gestão de Contas - Premium pode ter múltiplas contas
  {
    path: 'accounts',
    component: AccountsComponent,
    canActivate: [authGuard],
    data: {
      basicLimit: 1,  // Basic pode ter apenas 1 conta
      premiumLimit: 5 // Premium pode ter até 5 contas
    }
  },

  // Trade Detail - com suporte para compartilhamento com mentores
  {
    path: 'trade/:id',
    component: TradeDetail,
    canActivate: [authGuard]
  },

  // Trade Detail compartilhado (acesso via token para mentores)
  {
    path: 'shared/trade/:id',
    component: TradeDetail,
    canActivate: [mentorAccessGuard],
    data: {
      isMentorView: true
    }
  },

  // Trade Maintenance - disponível para todos exceto Mentor
  {
    path: 'trade-maintenance',
    component: TradeMaintenance,
    canActivate: [authGuard, userTypeGuard],
    data: {
      allowedUserTypes: [UserType.BASIC, UserType.PREMIUM, UserType.OWNER]
    }
  },

  // Conquistas - apenas Premium e Owner
  {
    path: 'achievements',
    component: AchievementsComponent,
    canActivate: [authGuard, premiumGuard]
  },

  // Perfil - disponível para todos
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },

  // Rotas administrativas - apenas Owner
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'users',
        loadComponent: () => import('./admin/user-management/user-management.component')
          .then(m => m.UserManagementComponent)
      },
      {
        path: 'stats',
        loadComponent: () => import('./admin/system-stats/system-stats.component')
          .then(m => m.SystemStatsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./admin/settings/settings.component')
          .then(m => m.SettingsComponent)
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full'
      }
    ]
  },

  // Páginas de erro e status
  {
    path: 'link-expired',
    loadComponent: () => import('./errors/link-expired/link-expired.component')
      .then(m => m.LinkExpiredComponent)
  },
  {
    path: 'invalid-link',
    loadComponent: () => import('./errors/invalid-link/invalid-link.component')
      .then(m => m.InvalidLinkComponent)
  },
  {
    path: 'buy-credits',
    loadComponent: () => import('./credits/buy-credits/buy-credits.component')
      .then(m => m.BuyCreditsComponent),
    canActivate: [authGuard, premiumGuard]
  },

  // Rota padrão
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Rota 404
  {
    path: '**',
    loadComponent: () => import('./errors/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];
