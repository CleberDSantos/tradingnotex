// navigation.ts - Versão Responsiva
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, NgIf, NgFor, NgClass, AsyncPipe],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss'
})
export class Navigation {
  showToolsDropdown = false;
  showSettingsDropdown = false;
  showMobileMenu = false;
  showUserMenu = false;
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

  // Toggle mobile menu
  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
    // Fecha o menu de usuário se estiver aberto
    if (this.showMobileMenu) {
      this.showUserMenu = false;
    }
  }

  // Toggle user menu mobile
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    // Fecha o menu principal se estiver aberto
    if (this.showUserMenu) {
      this.showMobileMenu = false;
    }
  }

  // Close mobile menu
  closeMobileMenu() {
    this.showMobileMenu = false;
    this.showUserMenu = false;
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
    this.closeMobileMenu();
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
