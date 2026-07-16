import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected username = '';
  protected password = '';
  protected confirmPassword = '';
  protected errorMessage = signal<string | null>(null);
  protected loading = signal<boolean>(false);

  protected onSubmit() {
    if (!this.username.trim() || !this.password.trim() || !this.confirmPassword.trim()) {
      this.errorMessage.set('Completa todos los campos.');
      return;
    }

    if (this.username.length < 3) {
      this.errorMessage.set('El usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.username, this.password)
      .then(() => {
        this.router.navigate(['/home']);
      })
      .catch((err: Error) => {
        this.errorMessage.set(err.message || 'Error al crear la cuenta.');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }
}
