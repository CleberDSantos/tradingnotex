import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, NgIf, AsyncPipe],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss'
})
export class Navigation {
  constructor(public authStateService: AuthStateService) {}
}
