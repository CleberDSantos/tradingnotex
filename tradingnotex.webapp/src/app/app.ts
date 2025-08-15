import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navigation } from './navigation/navigation';
import { AuthStateService } from './services/auth-state.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = 'TradingNoteX';

  // rotas públicas que NUNCA devem redirecionar para login
  private readonly PUBLIC_PREFIXES = [
    '/',            // home
    '/home',
    '/login',
    '/register',
    '/link-expired',
    '/invalid-link'
    // adicione aqui outras públicas se tiver (ex.: /not-found, /status, etc.)
  ];

  constructor(
    private authStateService: AuthStateService,
    private router: Router
  ) {
    // 🔒 NÃO faça redirect automático para /login aqui.
    // Apenas, se quiser, reaja à perda de sessão em rotas protegidas.
    this.authStateService.isAuthenticated$.subscribe(isAuth => {
      const path = (this.router.url || '/').split('?')[0];

      // Se estiver numa rota pública, NUNCA redirecione.
      const isPublic = this.PUBLIC_PREFIXES.some(prefix =>
        path === prefix || path.startsWith(prefix)
      );

      if (!isAuth && !isPublic) {
        // em rotas protegidas, deixe o guard decidir; ou redirecione aqui:
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      }
    });
  }

  ngOnInit() {
  }

  isAuthenticated(): boolean {
    return this.authStateService.isAuthenticated();
  }
}
