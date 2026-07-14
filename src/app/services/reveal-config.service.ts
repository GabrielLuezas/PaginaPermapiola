import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, catchError } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RevealConfig {
  revealTarget: string;  // ISO 8601 date string, e.g. "2026-07-14T21:00:00+02:00"
}

@Injectable({ providedIn: 'root' })
export class RevealConfigService {
  // -------------------------------------------------------------------
  // EDIT THIS URL to point to the raw URL of your GitHub Gist JSON file
  // e.g. https://gist.githubusercontent.com/TU_USUARIO/GIST_ID/raw/config.json
  // -------------------------------------------------------------------
  private readonly GIST_RAW_URL =
    'https://gist.githubusercontent.com/REEMPLAZAR_CON_TU_URL/raw/permapiola-config.json';

  // Fallback date used if the Gist cannot be reached
  private readonly FALLBACK_TARGET = '2026-07-14T21:00:00+02:00';

  private config$?: Observable<RevealConfig>;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<RevealConfig> {
    if (!this.config$) {
      this.config$ = this.http.get<RevealConfig>(this.GIST_RAW_URL).pipe(
        catchError(() => of({ revealTarget: this.FALLBACK_TARGET })),
        shareReplay(1)
      );
    }
    return this.config$;
  }

  getRevealTargetMs(): Observable<number> {
    return this.getConfig().pipe(
      map(cfg => new Date(cfg.revealTarget).getTime())
    );
  }
}
