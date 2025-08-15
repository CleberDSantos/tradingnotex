// upgrade.component.ts
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserManagementService } from '../services/user-management.service';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './upgrade.component.html'
})
export class UpgradeComponent {
  constructor(
    private userManagementService: UserManagementService,
    private router: Router
  ) {}

  startUpgrade() {
    // Implementar processo de upgrade
    this.userManagementService.upgradeToPremiun().subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
