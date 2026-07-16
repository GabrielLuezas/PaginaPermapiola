import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected username = '';
  protected password = '';
  protected errorMessage = signal<string | null>(null);
  protected loading = signal<boolean>(false);

  protected onSubmit() {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage.set('Completa todos los campos.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.username, this.password)
      .then(() => {
        this.router.navigate(['/home']);
      })
      .catch((err: Error) => {
        this.errorMessage.set(err.message || 'Error al iniciar sesión.');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }
}
