import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  protected readonly days = signal('00');
  protected readonly hours = signal('00');
  protected readonly minutes = signal('00');
  protected readonly seconds = signal('00');
  protected readonly timerTitle = signal('Siguiente Ronda de Participantes');
  
  protected readonly showToast = signal(false);
  protected readonly toastMessage = signal('Enlace copiado!');
  
  private timerInterval?: any;
  private revealTargetTime: number = 0;

  ngOnInit() {
    this.initializeTimerTarget();
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private initializeTimerTarget() {
    // Attempt to load existing target time from localStorage
    const savedTarget = localStorage.getItem('permapiola_reveal_target');
    const now = Date.now();

    if (savedTarget) {
      this.revealTargetTime = parseInt(savedTarget, 10);
      
      // If the saved target has already passed, advance it in 12-hour steps until it is in the future
      if (now > this.revealTargetTime) {
        const step = 12 * 60 * 60 * 1000; // 12 hours step
        while (now > this.revealTargetTime) {
          this.revealTargetTime += step;
        }
        localStorage.setItem('permapiola_reveal_target', this.revealTargetTime.toString());
      }
    } else {
      // First run: set countdown target to 10 minutes from now
      this.revealTargetTime = now + 10 * 60 * 1000;
      localStorage.setItem('permapiola_reveal_target', this.revealTargetTime.toString());
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
    
    // If the timer reaches 0, advance target by 12 hours for the next round
    if (now > this.revealTargetTime) {
      const step = 12 * 60 * 60 * 1000; // 12 hours
      while (now > this.revealTargetTime) {
        this.revealTargetTime += step;
      }
      localStorage.setItem('permapiola_reveal_target', this.revealTargetTime.toString());
    }

    const difference = this.revealTargetTime - now;

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
