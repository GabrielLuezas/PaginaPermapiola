import { Component, OnInit, signal, computed } from '@angular/core';
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
export class Players implements OnInit {
  protected readonly searchQuery = signal('');
  protected readonly filterType = signal<'all' | 'revealed' | 'locked'>('all');

  // 5 batches total, starting hidden (revealed: false)
  protected readonly groups = signal<ParticipantGroup[]>([
    {
      id: 1,
      name: 'Tanda 1',
      image: 'images/grupo1.png',
      revealed: false,
      revealDate: 'Tanda 1',
      members: [
        { name: 'comertetass', role: 'Participante', avatar: 'https://minotar.net/helm/comertetass/64.png' },
        { name: 'yohiXD', role: 'Participante', avatar: 'https://minotar.net/helm/yohiXD/64.png' },
        { name: 'QueTontoLeny', role: 'Participante', avatar: 'https://minotar.net/helm/QueTontoLeny/64.png' },
        { name: '_ZoshI_', role: 'Participante', avatar: 'https://minotar.net/helm/_ZoshI_/64.png' }
      ]
    },
    {
      id: 2,
      name: 'Tanda 2',
      image: 'images/grupo2.png',
      revealed: false,
      revealDate: 'Tanda 2',
      members: [
        { name: 'ShadowExx', role: 'Participante', avatar: 'https://minotar.net/helm/ShadowExx/64.png' },
        { name: 'proxing33', role: 'Participante', avatar: 'https://minotar.net/helm/proxing33/64.png' },
        { name: 'GabrielLucifer27', role: 'Participante', avatar: 'https://minotar.net/helm/GabrielLucifer27/64.png' }
      ]
    },
    {
      id: 3,
      name: 'Tanda 3',
      image: 'images/grupo3.png',
      revealed: false,
      revealDate: 'Tanda 3',
      members: [
        { name: 'suuupernatural', role: 'Participante', avatar: 'https://minotar.net/helm/suuupernatural/64.png' },
        { name: 'Lelielwaffen', role: 'Participante', avatar: 'https://minotar.net/helm/Lelielwaffen/64.png' },
        { name: 'draquin_', role: 'Participante', avatar: 'https://minotar.net/helm/draquin_/64.png' }
      ]
    },
    {
      id: 4,
      name: 'Tanda 4',
      image: 'images/grupo4.png',
      revealed: false,
      revealDate: 'Tanda 4',
      members: [
        { name: 'rSapphire', role: 'Participante', avatar: 'https://minotar.net/helm/rSapphire/64.png' },
        { name: 'Benjaaaah', role: 'Participante', avatar: 'https://minotar.net/helm/Benjaaaah/64.png' },
        { name: 'jdromero1011', role: 'Participante', avatar: 'https://minotar.net/helm/jdromero1011/64.png' }
      ]
    },
    {
      id: 5,
      name: 'Tanda 5',
      image: 'images/grupo5.png',
      revealed: false,
      revealDate: 'Tanda 5',
      members: [
        { name: 'Jirowoo', role: 'Participante', avatar: 'https://minotar.net/helm/Jirowoo/64.png' },
        { name: 'Rafismo', role: 'Participante', avatar: 'https://minotar.net/helm/Rafismo/64.png' },
        { name: 'ExplosionGirl', role: 'Participante', avatar: 'https://minotar.net/helm/ExplosionGirl/64.png' }
      ]
    }
  ]);

  ngOnInit() {
    this.calculateReveals();
  }

  private calculateReveals() {
    let originalTargetStr = localStorage.getItem('permapiola_original_target');
    const now = Date.now();

    if (!originalTargetStr) {
      // Sync initialization if they land here first
      const firstTarget = now + 10 * 60 * 1000;
      localStorage.setItem('permapiola_reveal_target', firstTarget.toString());
      localStorage.setItem('permapiola_original_target', firstTarget.toString());
      originalTargetStr = firstTarget.toString();
    }

    const originalTarget = parseInt(originalTargetStr, 10);

    // Update the revealed state of the groups based on the time elapsed
    this.groups.update(currentGroups => {
      return currentGroups.map(group => {
        let isRevealed = false;

        if (now >= originalTarget) {
          if (group.id === 1 || group.id === 2) {
            // Group 1 and 2 reveal automatically after 10 minutes
            isRevealed = true;
          } else {
            // Group 3, 4, and 5 reveal in 12-hour intervals after the initial target
            const msPast = now - originalTarget;
            const step = 12 * 60 * 60 * 1000;
            const intervals = Math.floor(msPast / step);

            if (group.id === 3 && intervals >= 1) isRevealed = true;
            if (group.id === 4 && intervals >= 2) isRevealed = true;
            if (group.id === 5 && intervals >= 3) isRevealed = true;
          }
        }

        return { ...group, revealed: isRevealed };
      });
    });
  }

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
