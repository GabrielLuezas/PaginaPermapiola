import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Player {
  name: string;
  role: string;
  avatar: string;
}

interface ParticipantGroup {
  id: number;
  name: string;
  image: string;
  revealed: boolean;
  revealDate?: string;
  members: Player[];
}

@Component({
  selector: 'app-players',
  imports: [CommonModule, FormsModule],
  templateUrl: './players.html',
  styleUrl: './players.css'
})
export class Players {
  protected readonly searchQuery = signal('');
  protected readonly filterType = signal<'all' | 'revealed' | 'locked'>('all');

  // Exactly 5 batches, all hidden (revealed: false) for now until further notice.
  protected readonly groups = signal<ParticipantGroup[]>([
    {
      id: 1,
      name: 'Tanda 1',
      image: 'images/grupo1.png',
      revealed: false,
      revealDate: 'Tanda 1',
      members: [
        { name: 'suuupernatural', role: 'Explorador', avatar: 'https://minotar.net/helm/suuupernatural/64.png' },
        { name: 'Lelielwaffen', role: 'Constructor', avatar: 'https://minotar.net/helm/Lelielwaffen/64.png' },
        { name: 'draquin_', role: 'Cazador', avatar: 'https://minotar.net/helm/draquin_/64.png' }
      ]
    },
    {
      id: 2,
      name: 'Tanda 2',
      image: 'images/grupo2.png',
      revealed: false,
      revealDate: 'Tanda 2',
      members: [
        { name: 'rSapphire', role: 'Alquimista', avatar: 'https://minotar.net/helm/rSapphire/64.png' },
        { name: 'Benjaaaah', role: 'Líder / Abanderado', avatar: 'https://minotar.net/helm/Benjaaaah/64.png' },
        { name: 'jdromero1011', role: 'Guerrero Ígneo', avatar: 'https://minotar.net/helm/jdromero1011/64.png' }
      ]
    },
    {
      id: 3,
      name: 'Tanda 3',
      image: 'images/grupo3.png',
      revealed: false,
      revealDate: 'Tanda 3',
      members: [
        { name: 'Jirowoo', role: 'Iluminador', avatar: 'https://minotar.net/helm/Jirowoo/64.png' },
        { name: 'Rafismo', role: 'Minero / Luigi', avatar: 'https://minotar.net/helm/Rafismo/64.png' },
        { name: 'ExplosionGirl', role: 'Especialista TNT', avatar: 'https://minotar.net/helm/ExplosionGirl/64.png' }
      ]
    },
    {
      id: 4,
      name: 'Tanda 4',
      image: 'images/grupo4.png',
      revealed: false,
      revealDate: 'Tanda 4',
      members: [
        { name: 'comertetass', role: 'Arquero Rana', avatar: 'https://minotar.net/helm/comertetass/64.png' },
        { name: 'yohiXD', role: 'Caballero Sombrío', avatar: 'https://minotar.net/helm/yohiXD/64.png' },
        { name: 'QueTontoLeny', role: 'Ballestero', avatar: 'https://minotar.net/helm/QueTontoLeny/64.png' },
        { name: '_ZoshI_', role: 'Guerrero de Elite', avatar: 'https://minotar.net/helm/_ZoshI_/64.png' }
      ]
    },
    {
      id: 5,
      name: 'Tanda 5',
      image: '',
      revealed: false,
      revealDate: 'Tanda 5',
      members: [
        { name: '???', role: 'Incógnito', avatar: '' },
        { name: '???', role: 'Incógnito', avatar: '' },
        { name: '???', role: 'Incógnito', avatar: '' }
      ]
    }
  ]);

  // Reactive computed list filtering search query and active tab filter
  protected readonly filteredGroups = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.filterType();
    
    return this.groups().filter(group => {
      // 1. Tab filtering
      if (type === 'revealed' && !group.revealed) return false;
      if (type === 'locked' && group.revealed) return false;
      
      // 2. Search query filtering
      if (!query) return true;
      
      const matchGroupName = group.name.toLowerCase().includes(query);
      const matchMemberName = group.members.some(member => 
        member.name.toLowerCase().includes(query)
      );
      
      return matchGroupName || matchMemberName;
    });
  });

  protected setFilter(type: 'all' | 'revealed' | 'locked') {
    this.filterType.set(type);
  }

  protected updateSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery.set(inputElement.value);
  }
}
