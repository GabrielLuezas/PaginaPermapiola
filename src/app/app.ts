import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('permapiola-web');
  protected readonly isMobileMenuOpen = signal(false);
  
  protected authService = inject(AuthService);

  protected toggleMobileMenu() {
    this.isMobileMenuOpen.update(open => !open);
  }

  protected closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  protected onLogout() {
    this.authService.logout();
    this.closeMobileMenu();
  }
}
