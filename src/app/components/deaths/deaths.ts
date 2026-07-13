import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FallenWarrior {
  name: string;
  avatar: string;
  cause: string;
  day: number;
  date: string;
  location: string;
  rank: string;
}

@Component({
  selector: 'app-deaths',
  imports: [CommonModule, FormsModule],
  templateUrl: './deaths.html',
  styleUrl: './deaths.css'
})
export class Deaths {
  protected readonly searchQuery = signal('');
  protected readonly sortBy = signal<'day' | 'name'>('day');

  // List of fallen players. 
  // Once the server starts, this list can be populated dynamically or updated statically.
  protected readonly fallenList = signal<FallenWarrior[]>([
    {
      name: 'SrGatoLoco',
      avatar: 'https://minotar.net/helm/SrGatoLoco/64.png',
      cause: 'Fue empujado al vacío por EvokerBoss durante la Fase 1',
      day: 3,
      date: '20 de Julio, 2026',
      location: 'Arena del Invocador (X: 120, Z: -350)',
      rank: 'Participante'
    },
    {
      name: 'MrSteve_98',
      avatar: 'https://minotar.net/helm/MrSteve_98/64.png',
      cause: 'Trató de nadar en lava intentando escapar de un Creeper cargado',
      day: 2,
      date: '19 de Julio, 2026',
      location: 'Subsuelo del Spawn (X: 50, Z: 40)',
      rank: 'Participante'
    },
    {
      name: 'lola_play',
      avatar: 'https://minotar.net/helm/lola_play/64.png',
      cause: 'Fue fulminado por un rayo del guerrero invocador (EvokerBoss)',
      day: 3,
      date: '20 de Julio, 2026',
      location: 'Arena del Invocador (X: 145, Z: -340)',
      rank: 'Veterano'
    },
    {
      name: 'xX_GamerPro_Xx',
      avatar: 'https://minotar.net/helm/xX_GamerPro_Xx/64.png',
      cause: 'Olvidó equiparse las Elytras cayendo desde la torre de su base',
      day: 1,
      date: '18 de Julio, 2026',
      location: 'Base de Alianza (X: -1200, Z: 890)',
      rank: 'Participante'
    },
    {
      name: 'AlexSurvival',
      avatar: 'https://minotar.net/helm/AlexSurvival/64.png',
      cause: 'Asesinado por comertetass en el evento de inicio de la Purga',
      day: 5,
      date: '22 de Julio, 2026',
      location: 'Tierras Salvajes (X: 450, Z: -120)',
      rank: 'Cazador'
    }
  ]);

  // Computed signal to filter and sort the fallen players list
  protected readonly filteredFallen = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sort = this.sortBy();

    let list = this.fallenList().filter(warrior => 
      warrior.name.toLowerCase().includes(query) || warrior.cause.toLowerCase().includes(query)
    );

    if (sort === 'day') {
      // Sort by survival day descending (longer survivors first)
      list = list.sort((a, b) => b.day - a.day);
    } else {
      // Sort alphabetically by name
      list = list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  });

  protected updateSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery.set(inputElement.value);
  }

  protected updateSort(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.sortBy.set(selectElement.value as 'day' | 'name');
  }
}
