import { authGuard } from './../../../src/app/auth-guard';
import { Logout } from './../../../src/app/logout/logout';
import { Risk } from './../../../src/app/risk/risk';
import { Partials } from './../../../src/app/partials/partials';
import { TradeDetail } from './../../../src/app/trade-detail/trade-detail';
import { Dashboard } from './../../../src/app/dashboard/dashboard';
import { Login } from './../../../src/app/login/login';
import { Routes } from "@angular/router";

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'trade/:id', component: TradeDetail, canActivate: [authGuard] },
  { path: 'partials', component: Partials, canActivate: [authGuard] },
  { path: 'risk', component: Risk, canActivate: [authGuard] },
  { path: 'logout', component: Logout },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
