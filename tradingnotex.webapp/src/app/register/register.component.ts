// register.component.ts
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserManagementService } from '../services/user-management.service';
import { AuthService } from '../services/auth.service';
import { RegisterRequest, UserType } from '../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styles: [`
    .card {
      background: rgba(15, 19, 26, 0.9);
      border: 1px solid #1b2330;
      border-radius: 0.75rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
    }

    input:focus, select:focus {
      box-shadow: 0 0 0 3px rgba(34,211,238,0.1);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class RegisterComponent {
  selectedPlan: 'basic' | 'premium' = 'basic';
  showPassword = false;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  registerData: RegisterRequest = {
    username: '',
    password: '',
    email: '',
    userType: UserType.BASIC,
    fullName: '',
    phone: '',
    company: '',
    tradingExperience: '',
    acceptTerms: false
  };

  constructor(
    private userManagementService: UserManagementService,
    private authService: AuthService,
    private router: Router
  ) {}

  selectPlan(plan: 'basic' | 'premium') {
    this.selectedPlan = plan;
    this.registerData.userType = plan === 'premium' ? UserType.PREMIUM : UserType.BASIC;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async onRegister() {
    if (this.loading) return;

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      // Validações adicionais
      if (!this.registerData.acceptTerms) {
        throw new Error('Você deve aceitar os termos de serviço');
      }

      if (this.registerData.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      // Para Premium, simular processo de pagamento
      if (this.selectedPlan === 'premium') {
        const paymentSuccess = await this.processPayment();
        if (!paymentSuccess) {
          throw new Error('Falha no processamento do pagamento');
        }
      }

      // Registrar usuário
      this.userManagementService.register(this.registerData).subscribe({
        next: (user) => {
          this.success = 'Conta criada com sucesso! Redirecionando...';

          // Auto-login após registro
          this.authService.login({
            username: this.registerData.username,
            password: this.registerData.password
          }).subscribe({
            next: () => {
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 2000);
            },
            error: (error) => {
              console.error('Erro no auto-login:', error);
              this.router.navigate(['/login']);
            }
          });
        },
        error: (error) => {
          console.error('Erro no registro:', error);
          this.error = this.getErrorMessage(error);
          this.loading = false;
        }
      });
    } catch (error: any) {
      this.error = error.message || 'Erro ao criar conta';
      this.loading = false;
    }
  }

  private async processPayment(): Promise<boolean> {
    // Simular integração com Stripe ou outro gateway de pagamento
    // Em produção, isso seria uma chamada real para o backend
    return new Promise((resolve) => {
      // Simular delay de processamento
      setTimeout(() => {
        // Em produção, abriria o checkout do Stripe
        console.log('Processando pagamento para Premium...');
        resolve(true);
      }, 1000);
    });
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }

    if (error.status === 409) {
      return 'Este nome de usuário ou e-mail já está em uso';
    }

    if (error.status === 400) {
      return 'Dados inválidos. Verifique o formulário e tente novamente';
    }

    return 'Erro ao criar conta. Tente novamente mais tarde';
  }
}
