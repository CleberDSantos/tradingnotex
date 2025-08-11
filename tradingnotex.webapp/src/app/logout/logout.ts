import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  imports: [],
  templateUrl: './logout.html',
  styleUrl: './logout.scss'
})
export class Logout {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.logout();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
        // Redirecionar para a página de login após logout bem-sucedido
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout failed', error);
        // Mesmo que o logout falhe, redirecionar para a página de login
        this.router.navigate(['/login']);
      }
    });
  }
}
