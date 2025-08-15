import { Component } from '@angular/core';
import { AuthService, LoginRequest } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginData: LoginRequest = {};
  error: string | null = null;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

onLogin() {
    if (!this.loginData.username || !this.loginData.password) {
      this.error = 'Por favor, preencha todos os campos';
      return;
    }

    this.error = null;
    this.loading = true;

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.loading = false;

        // Verificar se há uma URL de retorno salva
        const returnUrl = sessionStorage.getItem('returnUrl') || '/dashboard';
        sessionStorage.removeItem('returnUrl');

        // Pequeno delay para garantir que o estado foi atualizado
        setTimeout(() => {
          this.router.navigate([returnUrl]).then(success => {
            if (success) {
              console.log('Navigation successful to:', returnUrl);
            } else {
              console.log('Navigation failed, trying dashboard');
              this.router.navigate(['/dashboard']);
            }
          }).catch(err => {
            console.error('Navigation error:', err);
            // Fallback para dashboard em caso de erro
            this.router.navigate(['/dashboard']);
          });
        }, 100);
      },
      error: (error) => {
        console.error('Login failed', error);
        this.error = 'Falha no login. Verifique suas credenciais.';
        this.loading = false;
      }
    });
  }


}
