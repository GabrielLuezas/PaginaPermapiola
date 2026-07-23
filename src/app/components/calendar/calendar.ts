import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EventType = 'inicio' | 'fin' | 'cambios' | 'evento' | 'dragonfight' | 'megadungeon' | 'dungeon';

export interface CalendarEvent {
  id: string;
  day: number;          // day of August
  hour: number;         // 24h hora España CEST (UTC+2)
  minute: number;
  type: EventType;
  title: string;
  description: string;
}

export interface CalendarDay {
  day: number | null;   // null = empty cell (padding)
  events: CalendarEvent[];
  isToday: boolean;
  isPast: boolean;
}

// Server launch: August 8, 2026 — referencia: España CEST (UTC+2), 19:00h
const SERVER_EVENTS: CalendarEvent[] = [
  {
    id: 'dia1',
    day: 8, hour: 19, minute: 0,
    type: 'inicio',
    title: 'Día 1 (Inicio)',
    description: 'Apertura oficial de Permapiola Survival Temporada 6. Todos los participantes entran con 1 sola vida. El permadeath comienza.'
  },
  {
    id: 'dia3',
    day: 10, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Día 3',
    description: 'Parche de cambios y ajustes.'
  },
  {
    id: 'dia7',
    day: 14, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Día 7',
    description: 'Parche de cambios y ajustes.'
  },
  {
    id: 'dia10',
    day: 17, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Día 10',
    description: 'Parche de cambios y ajustes.'
  },
  {
    id: 'dia14',
    day: 21, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Día 14',
    description: 'Parche de cambios y ajustes.'
  },
  {
    id: 'dia18',
    day: 25, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Día 18',
    description: 'Parche de cambios y ajustes.'
  },
  {
    id: 'dia21',
    day: 28, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Día 21',
    description: 'Parche de cambios y ajustes.'
  },
  {
    id: 'dia23',
    day: 30, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Día 23',
    description: 'Parche de cambios (End open).'
  },
  {
    id: 'dia23_dragon',
    day: 30, hour: 20, minute: 0,
    type: 'dragonfight',
    title: 'Evento del Dragón',
    description: 'La batalla definitiva contra el Dragón del Fin. (End open)'
  },
  {
    id: 'dia25',
    day: 32, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Día 25',
    description: 'Parche de cambios y ajustes.'
  },
  {
    id: 'dia28',
    day: 35, hour: 19, minute: 0,
    type: 'fin',
    title: 'Día 28 (Fin)',
    description: 'Último parche y fin de la temporada.'
  }
];

// Offsets relativos a España CEST (UTC+2)
const TIMEZONES = [
  { flag: 'es', label: 'España',       offset:  0,  abbr: 'CEST' },
  { flag: 'br', label: 'Brasil',        offset: -5,  abbr: 'BRT'  },
  { flag: 'ar', label: 'Argentina',     offset: -5,  abbr: 'ART'  },
  { flag: 'cl', label: 'Chile',         offset: -6,  abbr: 'CLT'  },
  { flag: 've', label: 'Venezuela',     offset: -6,  abbr: 'VET'  },
  { flag: 'us', label: 'EE.UU. (ET)',  offset: -6,  abbr: 'EDT'  },
  { flag: 'co', label: 'Colombia',      offset: -7,  abbr: 'COT'  },
  { flag: 'pe', label: 'Perú',          offset: -7,  abbr: 'PET'  },
  { flag: 'mx', label: 'México',        offset: -7,  abbr: 'CDT'  },
];

@Component({
  selector: 'app-calendar',
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class Calendar {
  protected readonly selectedEvent = signal<CalendarEvent | null>(null);

  protected readonly eventTypeLabels: Record<EventType, string> = {
    inicio:      'Inicio / Fin de Temporada',
    fin:         'Inicio / Fin de Temporada',
    cambios:     'Parche de Cambios',
    evento:      'Evento Especial',
    dragonfight: 'Dragon Fight',
    megadungeon: 'MegaDungeon',
    dungeon:     'Dungeon / Boss',
  };

  // August 2026: starts on Saturday (day index 5 in Mon-first week)
  // Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  // Aug 1 = Saturday → padding = 5
  protected readonly calendarDays = computed<CalendarDay[]>(() => {
    const today = new Date();
    const startPadding = 5; // Aug 1 is Saturday
    const totalDays = 35; // Hasta el 4 de septiembre

    const days: CalendarDay[] = [];

    // Empty padding cells
    for (let i = 0; i < startPadding; i++) {
      days.push({ day: null, events: [], isToday: false, isPast: false });
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const evts = SERVER_EVENTS.filter(e => e.day === d);
      
      let isToday = false;
      let isPast = false;
      
      if (today.getFullYear() === 2026) {
        const month = d <= 31 ? 7 : 8; // 7=Agosto, 8=Septiembre
        const date = d <= 31 ? d : d - 31;
        
        if (today.getMonth() === month) {
          isToday = today.getDate() === date;
          isPast = today.getDate() > date;
        } else if (today.getMonth() > month) {
          isPast = true;
        }
      } else if (today.getFullYear() > 2026) {
        isPast = true;
      }

      days.push({
        day: d,
        events: evts,
        isToday,
        isPast
      });
    }

    return days;
  });

  protected readonly timezones = TIMEZONES;

  protected openEvent(event: CalendarEvent) {
    this.selectedEvent.set(event);
    document.body.style.overflow = 'hidden';
  }

  protected closeModal() {
    this.selectedEvent.set(null);
    document.body.style.overflow = '';
  }

  // Convierte la hora base (España CEST) al offset de cada zona
  protected getTimeForZone(baseHour: number, baseMinute: number, offsetDelta: number): string {
    let h = baseHour + offsetDelta;
    let m = baseMinute;
    let suffix = '';

    if (h >= 24) { h -= 24; suffix = ' (+1d)'; }
    if (h < 0)  { h += 24; suffix = ' (-1d)'; }

    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    return `${hh}:${mm}${suffix}`;
  }

  protected getEventTypeClass(type: EventType): string {
    const map: Record<EventType, string> = {
      inicio:      'ev-inicio',
      fin:         'ev-fin',
      cambios:     'ev-cambios',
      evento:      'ev-evento',
      dragonfight: 'ev-dragon',
      megadungeon: 'ev-mega',
      dungeon:     'ev-dungeon',
    };
    return map[type] ?? '';
  }
}
