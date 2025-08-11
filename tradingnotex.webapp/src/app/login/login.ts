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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.error = null;
    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        // Redirecionar para o dashboard após login bem-sucedido
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login failed', error);
        this.error = 'Falha no login. Verifique suas credenciais.';
      }
    });
  }
}
