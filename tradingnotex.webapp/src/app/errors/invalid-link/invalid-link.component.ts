import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-invalid-link',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="text-6xl mb-4">🔗</div>
        <h1 class="text-3xl font-bold text-white mb-2">Link Inválido</h1>
        <p class="text-gray-400 mb-6">Este link de compartilhamento não é válido ou foi revogado.</p>
        <a routerLink="/dashboard"
           class="px-6 py-3 bg-gradient-to-r from-cyanx to-accent rounded-lg font-medium inline-block">
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  `,
  styles: []
})
export class InvalidLinkComponent {}
