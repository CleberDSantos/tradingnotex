import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';
import { AuthService } from '../services/auth.service';

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
  showToolsDropdown = false;
  showSettingsDropdown = false;
  username: string | null = null;

  // Tools routes for active state
  private toolsRoutes = ['/trade-maintenance', '/partials'];
  private settingsRoutes = ['/profile', '/accounts'];

  constructor(
    public authStateService: AuthStateService,
    private authService: AuthService,
    private router: Router
  ) {
    this.username = localStorage.getItem('username');
  }

  // Check if any tools route is active
  isToolsRouteActive(): boolean {
    return this.toolsRoutes.some(route => this.router.url.startsWith(route));
  }

  // Check if any settings route is active
  isSettingsRouteActive(): boolean {
    return this.settingsRoutes.some(route => this.router.url.startsWith(route));
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Erro ao fazer logout:', error);
        // Fazer logout local mesmo se houver erro no servidor
        this.authStateService.setAuthenticated(false);
        this.router.navigate(['/login']);
      }
    });
  }
}
