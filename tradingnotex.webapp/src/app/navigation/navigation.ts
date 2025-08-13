import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';

interface Alert {
  type: 'good' | 'bad' | 'accent';
  icon: string;
  title: string;
  msg: string;
}

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, NgIf, NgFor, NgClass, AsyncPipe],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss'
})
export class Navigation {
  // Alertas
  alerts: Alert[] = [];
  showAlerts = false;

  // Dropdown control
  showDropdown = false;

  // Tools routes for active state
  private toolsRoutes = ['/trade-maintenance', '/partials'];

  constructor(
    public authStateService: AuthStateService,
    private router: Router
  ) {
    this.seedAlerts();
  }

  toggleAlerts() {
    this.showAlerts = !this.showAlerts;
    if (this.showAlerts) {
      setTimeout(() => {
        this.showAlerts = false;
      }, 6000);
    }
  }

  // Check if any tools route is active
  isToolsRouteActive(): boolean {
    return this.toolsRoutes.some(route => this.router.url.startsWith(route));
  }

  seedAlerts() {
    this.alerts = [
      {
        type: 'bad',
        icon: '⚠️',
        title: 'Padrão de Ganância Detectado',
        msg: 'Você devolveu lucros em <strong>3 dos últimos 5 trades</strong> após atingir a meta.'
      },
      {
        type: 'accent',
        icon: '⏰',
        title: 'Overtrading Alert',
        msg: 'Média de <strong>8 trades/dia</strong> esta semana. Seu ideal é 4-5.'
      },
      {
        type: 'good',
        icon: '✅',
        title: 'Melhoria Detectada!',
        msg: 'Win rate aumentou <strong>15%</strong> após implementar stop loss fixo.'
      }
    ];
  }
}
