import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Navigation } from './navigation/navigation';
import { AuthStateService } from './services/auth-state.service';
import { NgIf } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = 'TradingNoteX';
  showShellNav = true;

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

  private readonly hideOn = new Set<string>([
    '/', '/home', '/login', '/register'
  ]);

    constructor(private router: Router) {
    // Atualiza ao navegar
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const path = e.urlAfterRedirects.split('?')[0];
        this.showShellNav = !this.hideOn.has(path);
      });

    // Estado inicial (reload direto numa rota)
    const path = this.router.url.split('?')[0];
    this.showShellNav = !this.hideOn.has(path);
  }

  ngOnInit() {
  }

  // isAuthenticated(): boolean {
  //   return this.authStateService.isAuthenticated();
  // }
}
