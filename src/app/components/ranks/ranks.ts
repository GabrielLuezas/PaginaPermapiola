import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ranks',
  imports: [CommonModule],
  templateUrl: './ranks.html',
  styleUrl: './ranks.css'
})
export class Ranks {
  // false = Temporal (Mensual), true = Permanente
  protected readonly isPermanent = signal<boolean>(false);
  protected readonly paypalEmail = 'gabrielucifer@outlook.es';
  protected readonly copied = signal<boolean>(false);

  protected togglePeriod(permanent: boolean) {
    this.isPermanent.set(permanent);
  }

  protected copyEmail() {
    navigator.clipboard.writeText(this.paypalEmail)
      .then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2500);
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles: ', err);
      });
  }
}
