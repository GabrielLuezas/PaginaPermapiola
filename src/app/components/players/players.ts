import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
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
  protected readonly lightboxImage = signal<string | null>(null);

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
        { name: 'ItsNG266', role: 'Participante', avatar: 'https://minotar.net/helm/ItsNG266/64.png' },
        { name: 'MACUM', role: 'Participante', avatar: 'https://minotar.net/helm/MACUM/64.png' },
        { name: 'S_Stark', role: 'Participante', avatar: 'https://minotar.net/helm/S_Stark/64.png' }
      ]
    },
    {
      id: 4,
      name: 'Tanda 4',
      image: 'images/grupo4.png',
      revealed: false,
      revealDate: 'Tanda 4',
      members: [
        { name: 'rShapphire', role: 'Participante', avatar: 'https://minotar.net/helm/rShapphire/64.png' },
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
        { name: 'ImNate987_', role: 'Participante', avatar: 'https://minotar.net/helm/ImNate987_/64.png' },
        { name: 'iBeenji', role: 'Participante', avatar: 'https://minotar.net/helm/iBeenji/64.png' },
        { name: 'PeruvianMaster69', role: 'Participante', avatar: 'https://minotar.net/helm/PeruvianMaster69/64.png' }
      ]
    },
    {
      id: 6,
      name: 'Tanda 6',
      image: 'images/grupo6.png',
      revealed: false,
      revealDate: 'Tanda 6',
      members: [
        { name: 'Dunao_', role: 'Participante', avatar: 'https://minotar.net/helm/Dunao_/64.png' },
        { name: 'SuperMiGamer003', role: 'Participante', avatar: 'https://minotar.net/helm/SuperMiGamer003/64.png' },
        { name: 'CarolBlazing', role: 'Participante', avatar: 'https://minotar.net/helm/CarolBlazing/64.png' },
        { name: 'itzKira811', role: 'Participante', avatar: 'https://minotar.net/helm/itzKira811/64.png' },
        { name: 'Elplatanero_', role: 'Participante', avatar: 'https://minotar.net/helm/Elplatanero_/64.png' }
      ]
    },
    {
      id: 7,
      name: 'Tanda 7',
      image: 'images/grupo7.png',
      revealed: false,
      revealDate: 'Tanda 7',
      members: [
        { name: 'hdlux', role: 'Participante', avatar: 'https://minotar.net/helm/hdlux/64.png' },
        { name: 'jaiba12', role: 'Participante', avatar: 'https://minotar.net/helm/jaiba12/64.png' },
        { name: 'MadeByKinda', role: 'Participante', avatar: 'https://minotar.net/helm/MadeByKinda/64.png' }
      ]
    },
    {
      id: 8,
      name: 'Tanda 8',
      image: 'images/grupo8.png',
      revealed: false,
      revealDate: 'Tanda 8',
      members: [
        { name: 'TheBasty257', role: 'Participante', avatar: 'https://minotar.net/helm/TheBasty257/64.png' },
        { name: 'EchiTimeYT', role: 'Participante', avatar: 'https://minotar.net/helm/EchiTimeYT/64.png' },
        { name: 'SrInteligencia', role: 'Participante', avatar: 'https://minotar.net/helm/SrInteligencia/64.png' }
      ]
    },
    {
      id: 9,
      name: 'Tanda 9',
      image: 'images/grupo9.png',
      revealed: false,
      revealDate: 'Tanda 9',
      members: [
        { name: 'SlowDeAlex', role: 'Participante', avatar: 'https://minotar.net/helm/SlowDeAlex/64.png' },
        { name: 'LechugaMC', role: 'Participante', avatar: 'https://minotar.net/helm/LechugaMC/64.png' },
        { name: 'Aaa_OnichanUwU', role: 'Participante', avatar: 'https://minotar.net/helm/Aaa_OnichanUwU/64.png' }
      ]
    },
    {
      id: 10,
      name: 'Tanda 10',
      image: 'images/grupo10.png',
      revealed: false,
      revealDate: 'Tanda 10',
      members: [
        { name: 'Jirowoo', role: 'Participante', avatar: 'https://minotar.net/helm/Jirowoo/64.png' },
        { name: 'Rafismo', role: 'Participante', avatar: 'https://minotar.net/helm/Rafismo/64.png' },
        { name: 'ExplosionGIrl', role: 'Participante', avatar: 'https://minotar.net/helm/ExplosionGIrl/64.png' }
      ]
    },
    {
      id: 11,
      name: 'Tanda 11',
      image: 'images/grupo11.png',
      revealed: false,
      revealDate: 'Tanda 11',
      members: [
        { name: 'Nataa_', role: 'Participante', avatar: 'https://minotar.net/helm/Nataa_/64.png' },
        { name: 'MailsBowi', role: 'Participante', avatar: 'https://minotar.net/helm/MailsBowi/64.png' },
        { name: 'YoniJP1000', role: 'Participante', avatar: 'https://minotar.net/helm/YoniJP1000/64.png' }
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
            // Tanda 1 y 2 se revelan en el primer objetivo
            isRevealed = true;
          } else {
            const msPast = now - originalTarget;
            const step = 12 * 60 * 60 * 1000; // cada 12 horas
            const intervals = Math.floor(msPast / step);

            // Tanda 3, 4 y 5 → a las 12h (interval >= 1)
            if ((group.id === 3 || group.id === 4 || group.id === 5) && intervals >= 1) isRevealed = true;

            // Tanda 6, 7 y 8 → a las 24h (interval >= 2)
            if ((group.id === 6 || group.id === 7 || group.id === 8) && intervals >= 2) isRevealed = true;

            // Tanda 9, 10 y 11 → a las 36h (interval >= 3)
            if ((group.id === 9 || group.id === 10 || group.id === 11) && intervals >= 3) isRevealed = true;
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

  protected openLightbox(imageSrc: string) {
    this.lightboxImage.set(imageSrc);
    document.body.style.overflow = 'hidden';
  }

  protected closeLightbox() {
    this.lightboxImage.set(null);
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey() {
    this.closeLightbox();
  }

  ngOnDestroy() {
    this.configSub?.unsubscribe();
  }
}
