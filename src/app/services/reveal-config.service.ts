import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RevealConfigService {
  // ---------------------------------------------------------------
  // Cambia esta fecha para controlar cuándo se revelan las Tandas 1 y 2.
  // Formato ISO 8601. Todos los usuarios del mundo calcularán el mismo
  // contador hacia este instante exacto de tiempo universal.
  // ---------------------------------------------------------------
  private readonly REVEAL_TARGET = '2026-07-14T22:15:00+02:00';

  getRevealTargetMs(): Observable<number> {
    return of(new Date(this.REVEAL_TARGET).getTime());
  }
}
