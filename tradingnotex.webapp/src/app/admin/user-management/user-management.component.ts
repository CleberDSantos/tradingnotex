import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserManagementService } from '../../services/user-management.service';
import { User, UserType } from '../../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto p-6 space-y-6">
      <header class="animate-slide-up">
        <h1 class="text-2xl font-bold text-white">👥 Gerenciamento de Usuários</h1>
        <p class="text-gray-400 text-sm mt-1">Gerencie usuários e permissões do sistema</p>
      </header>

      <section class="card p-6 animate-slide-up">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gradient-to-r from-edge to-card text-gray-300">
              <tr>
                <th class="text-left p-2">Usuário</th>
                <th class="text-left p-2">Email</th>
                <th class="text-left p-2">Tipo</th>
                <th class="text-left p-2">Status</th>
                <th class="text-center p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users" class="hover:bg-edge/20 transition-all border-b border-edge/40">
                <td class="p-2">{{ user.username }}</td>
                <td class="p-2">{{ user.email }}</td>
                <td class="p-2">
                  <span class="px-2 py-1 rounded-full text-xs"
                        [ngClass]="{
                          'bg-gray-500/20 text-gray-400': user.userType === 'basic',
                          'bg-accent/20 text-accent': user.userType === 'premium',
                          'bg-purple/20 text-purple': user.userType === 'mentor',
                          'bg-bad/20 text-bad': user.userType === 'owner'
                        }">
                    {{ user.userType | uppercase }}
                  </span>
                </td>
                <td class="p-2">
                  <span class="px-2 py-1 rounded-full text-xs"
                        [ngClass]="user.isActive ? 'bg-good/20 text-good' : 'bg-bad/20 text-bad'">
                    {{ user.isActive ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="p-2 text-center">
                  <button (click)="editUser(user)" class="p-1 hover:bg-cyanx/20 rounded mx-1">✏️</button>
                  <button (click)="toggleUserStatus(user)" class="p-1 hover:bg-accent/20 rounded mx-1">
                    {{ user.isActive ? '🔒' : '🔓' }}
                  </button>
                </td>
              </tr>
              <tr *ngIf="users.length === 0">
                <td colspan="5" class="text-center py-8 text-gray-400">
                  Nenhum usuário encontrado
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .card {
      background: linear-gradient(145deg, #1a1a2e 0%, #0f0f1e 100%);
      border: 1px solid #2a2a3e;
      border-radius: 12px;
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slide-up 0.3s ease-out forwards;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];

  constructor(private userManagementService: UserManagementService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    // Em produção, isso viria de uma API
    this.users = [
      {
        objectId: '1',
        username: 'demo',
        email: 'demo@example.com',
        userType: UserType.BASIC,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
  }

  editUser(user: User) {
    console.log('Edit user:', user);
  }

  toggleUserStatus(user: User) {
    user.isActive = !user.isActive;
  }
}
