import { Injectable, signal } from '@angular/core';

export interface User {
  id: number;
  username: string;
  rank: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'permapiola_token';
  
  readonly currentUser = signal<User | null>(null);
  readonly loading = signal<boolean>(true);

  constructor() {
    this.checkSession();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  checkSession() {
    const token = this.getToken();
    if (!token) {
      this.currentUser.set(null);
      this.loading.set(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Sesión expirada o inválida');
      return res.json();
    })
    .then(data => {
      this.currentUser.set(data.user);
    })
    .catch(() => {
      this.logout();
    })
    .finally(() => {
      this.loading.set(false);
    });
  }

  login(username: string, password: string): Promise<void> {
    return fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.error || 'Error al iniciar sesión');
        });
      }
      return res.json();
    })
    .then(data => {
      localStorage.setItem(this.tokenKey, data.token);
      this.currentUser.set(data.user);
    });
  }

  register(username: string, password: string): Promise<void> {
    return fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.error || 'Error al registrarse');
        });
      }
      return res.json();
    })
    .then(data => {
      localStorage.setItem(this.tokenKey, data.token);
      this.currentUser.set(data.user);
    });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
  }
}
