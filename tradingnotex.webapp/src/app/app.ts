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

  constructor(
    private authStateService: AuthStateService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar se usuário está autenticado ao iniciar
    if (!this.authStateService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  isAuthenticated(): boolean {
    return this.authStateService.isAuthenticated();
  }
}
