import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Partials } from './partials/partials';
import { Risk } from './risk/risk';
import { Logout } from './logout/logout';
import { authGuard } from './auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'partials', component: Partials, canActivate: [authGuard] },
  { path: 'risk', component: Risk, canActivate: [authGuard] },
  { path: 'logout', component: Logout },
  { path: '', redirectTo: '/login', pathMatch: 'full' } // Redireciona para login por padrão
];
