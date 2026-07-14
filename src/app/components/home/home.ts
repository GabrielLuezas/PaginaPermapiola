import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RevealConfigService } from '../../services/reveal-config.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  private revealConfig = inject(RevealConfigService);

  protected readonly days = signal('00');
  protected readonly hours = signal('00');
  protected readonly minutes = signal('00');
  protected readonly seconds = signal('00');
  protected readonly timerTitle = signal('Siguiente Ronda de Participantes');

  protected readonly showToast = signal(false);
  protected readonly toastMessage = signal('Enlace copiado!');

  private timerInterval?: ReturnType<typeof setInterval>;
  private revealTargetMs = 0;
  private configSub?: Subscription;

  ngOnInit() {
    this.configSub = this.revealConfig.getRevealTargetMs().subscribe(targetMs => {
      this.revealTargetMs = targetMs;
      this.startCountdown();
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.configSub?.unsubscribe();
  }

  private startCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.updateCountdown();
    this.timerInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  private updateCountdown() {
    if (!this.revealTargetMs) return;

    const now = Date.now();
    const baseTarget = this.revealTargetMs;
    let target = baseTarget;

    // If base target has already passed, advance in 12-hour steps
    if (now > baseTarget) {
      const msPast = now - baseTarget;
      const step = 12 * 60 * 60 * 1000;
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
