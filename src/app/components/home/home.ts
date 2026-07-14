import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  // Global synchronized target base date (approx 10 minutes from current request time)
  private readonly baseTargetDate = new Date('2026-07-14T02:25:00+02:00');
  
  protected readonly days = signal('00');
  protected readonly hours = signal('00');
  protected readonly minutes = signal('00');
  protected readonly seconds = signal('00');
  protected readonly timerTitle = signal('Siguiente Ronda de Participantes');
  
  protected readonly showToast = signal(false);
  protected readonly toastMessage = signal('Enlace copiado!');
  
  private timerInterval?: any;

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private startCountdown() {
    this.updateCountdown();
    this.timerInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  private updateCountdown() {
    const now = Date.now();
    const baseTarget = this.baseTargetDate.getTime();
    let target = baseTarget;

    // Synchronized calculation for 12 hours interval adjustments
    if (now > baseTarget) {
      const msPast = now - baseTarget;
      const step = 12 * 60 * 60 * 1000; // 12 hours
      const intervals = Math.floor(msPast / step);
      target = baseTarget + (intervals + 1) * step;
    }

    const difference = target - now;

    const d = Math.floor(difference / (1000 * 60 * 60 * 24));
    const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((difference % (1000 * 60)) / 1000);

    this.days.set(this.padZero(d));
    this.hours.set(this.padZero(h));
    this.minutes.set(this.padZero(m));
    this.seconds.set(this.padZero(s));
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }
}
