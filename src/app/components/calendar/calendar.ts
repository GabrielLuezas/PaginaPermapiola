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
    id: 'inicio',
    day: 8, hour: 19, minute: 0,
    type: 'inicio',
    title: 'Inicio del Servidor',
    description: 'Apertura oficial de Permapiola Survival Temporada 6. Todos los participantes entran con 1 sola vida. El permadeath comienza.'
  },
  /*
  {
    id: 'boss1',
    day: 10, hour: 18, minute: 0,
    type: 'dungeon',
    title: 'Boss',
    description: 'Aparece el primer jefe customizado. Un enorme Guardián de Piedra que pone a prueba la cooperación de los grupos.'
  },
  {
    id: 'cambios1',
    day: 12, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Parche de Cambios #1',
    description: 'Primer parche de balanceo. Se ajustan drops, mecánicas de PVP y se revelan nuevas zonas del mapa.'
  },
  {
    id: 'evento1',
    day: 14, hour: 19, minute: 0,
    type: 'evento',
    title: 'Evento',
    description: 'Evento especial de 2 horas donde llueven mobs reforzados. Los equipos que sobrevivan recibirán recompensas únicas.'
  },
  {
    id: 'dungeon1',
    day: 16, hour: 18, minute: 0,
    type: 'dungeon',
    title: 'Dungeon',
    description: 'Se abre la primera dungeon del servidor. Solo los equipos más coordinados podrán obtener el loot legendario.'
  },
  {
    id: 'cambios2',
    day: 18, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Parche de Cambios #2',
    description: 'Segundo parche. Se activan nuevas mecánicas, ajustes de economía y se habilita el PVP en zonas neutras.'
  },
  {
    id: 'megadungeon1',
    day: 20, hour: 18, minute: 0,
    type: 'megadungeon',
    title: 'MegaDungeon',
    description: 'La primera MegaDungeon del servidor. Un laberinto de 5 pisos con jefes únicos. Solo los más fuertes saldrán con vida.'
  },
  {
    id: 'evento2',
    day: 22, hour: 20, minute: 0,
    type: 'evento',
    title: 'Evento',
    description: 'Se desvela el Altar Sagrado de Resurrección. Los equipos podrán traer de vuelta a un compañero caído (límite: 1 por equipo).'
  },
  {
    id: 'cambios3',
    day: 24, hour: 19, minute: 0,
    type: 'cambios',
    title: 'Parche de Cambios #3',
    description: 'Tercer parche. Se activa el fuego amigo en zonas específicas. Las alianzas se ponen a prueba.'
  },
  {
    id: 'boss2',
    day: 25, hour: 18, minute: 0,
    type: 'dungeon',
    title: 'Boss',
    description: 'Regresa el EvokerBoss potenciado. Invocará tormentas y guerreros de piedra. Se requiere máxima cooperación.'
  },
  {
    id: 'dragonfight',
    day: 27, hour: 19, minute: 0,
    type: 'dragonfight',
    title: 'DragonFight',
    description: 'La batalla definitiva contra el Dragón del Fin. El equipo que lo derrote se corona campeón de la temporada.'
  },
  {
    id: 'fin',
    day: 28, hour: 20, minute: 0,
    type: 'fin',
    title: 'Fin del Servidor',
    description: 'Cierre oficial de la temporada. Se revelan los campeones y comienza la ceremonia de premios.'
  }
  */
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
    const todayDay = today.getMonth() === 7 && today.getFullYear() === 2026 ? today.getDate() : -1;
    const daysInAug = 31;
    const startPadding = 5; // Aug 1 is Saturday

    const days: CalendarDay[] = [];

    // Empty padding cells
    for (let i = 0; i < startPadding; i++) {
      days.push({ day: null, events: [], isToday: false, isPast: false });
    }

    // Actual days
    for (let d = 1; d <= daysInAug; d++) {
      const evts = SERVER_EVENTS.filter(e => e.day === d);
      days.push({
        day: d,
        events: evts,
        isToday: d === todayDay,
        isPast: d < todayDay
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
