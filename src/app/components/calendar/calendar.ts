import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarEvent {
  date: string;
  title: string;
  description: string;
  status: 'past' | 'active' | 'upcoming';
  icon: string;
}

@Component({
  selector: 'app-calendar',
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class Calendar {
  protected readonly events = signal<CalendarEvent[]>([
    {
      date: '10 de Julio, 2026',
      title: 'Apertura de Postulaciones',
      description: 'Se abre el registro de participantes en Discord. La comunidad postula a sus escuadrones de supervivencia.',
      status: 'past',
      icon: '📝'
    },
    {
      date: '13 de Julio - 17 de Julio, 2026',
      title: 'Anuncio Diario de Jugadores',
      description: 'Cada 24 horas desvelamos nuevos grupos que sobrevivirán juntos. Estate atento al cronómetro de la página de inicio.',
      status: 'active',
      icon: '🔥'
    },
    {
      date: '18 de Julio, 2026 (20:00 Local)',
      title: 'Apertura de Permapiola',
      description: 'Lanzamiento oficial del servidor. Todos los participantes entran con 1 sola vida. El juego del permadeath comienza.',
      status: 'upcoming',
      icon: '⚔️'
    },
    {
      date: '20 de Julio, 2026',
      title: 'Evento: El Primer Azote',
      description: 'Aparece el primer jefe customizado: EvokerBoss. Invocará tormentas y guerreros de piedra. Se requiere cooperación.',
      status: 'upcoming',
      icon: '👿'
    },
    {
      date: '22 de Julio, 2026',
      title: 'Habilitación de Revivir por Altar',
      description: 'Se desvela el altar sagrado de resurrección. Los grupos podrán recolectar fragmentos raros para traer de vuelta a un compañero caído (límite de 1 revivir por equipo).',
      status: 'upcoming',
      icon: '✨'
    },
    {
      date: '25 de Julio, 2026',
      title: 'Fase de Purga Extrema (PVP)',
      description: 'El fuego amigo y el PVP global son activados. Las alianzas de PartyGUI se verán expuestas y la supervivencia final dará comienzo.',
      status: 'upcoming',
      icon: '💀'
    }
  ]);
}
