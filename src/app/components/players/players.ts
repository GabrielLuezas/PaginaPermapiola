import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RevealConfigService } from '../../services/reveal-config.service';
import { Subscription } from 'rxjs';

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
  private revealConfig = inject(RevealConfigService);
  private configSub?: Subscription;

  protected readonly searchQuery = signal('');
  protected readonly filterType = signal<'all' | 'revealed' | 'locked'>('all');

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
        { name: 'GabrielLucifer22', role: 'Participante', avatar: 'https://minotar.net/helm/GabrielLucifer22/64.png' }
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
    this.configSub = this.revealConfig.getRevealTargetMs().subscribe(targetMs => {
      this.calculateReveals(targetMs);
    });
  }

  private calculateReveals(originalTarget: number) {
    const now = Date.now();

    this.groups.update(currentGroups => {
      return currentGroups.map(group => {
        let isRevealed = false;

        if (now >= originalTarget) {
          if (group.id === 1 || group.id === 2) {
            // Tanda 1 y 2 se revelan en el primer objetivo (22:15)
            isRevealed = true;
          } else {
            // Tanda 3, 4 y 5 se revelan juntas a las 12 horas del objetivo inicial
            const msPast = now - originalTarget;
            const step = 12 * 60 * 60 * 1000;
            const intervals = Math.floor(msPast / step);

            if ((group.id === 3 || group.id === 4 || group.id === 5) && intervals >= 1) isRevealed = true;
          }
        }

        return { ...group, revealed: isRevealed };
      });
    });
  }

  protected readonly filteredGroups = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.filterType();

    return this.groups().filter(group => {
      if (type === 'revealed' && !group.revealed) return false;
      if (type === 'locked' && group.revealed) return false;
      if (!query) return true;

      const matchGroupName = group.name.toLowerCase().includes(query);
      const matchMemberName = group.members.some(m => m.name.toLowerCase().includes(query));
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

  ngOnDestroy() {
    this.configSub?.unsubscribe();
  }
}
