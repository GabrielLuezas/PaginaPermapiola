import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FallenWarrior {
  name: string;
  avatar: string;
  cause: string;
  day: number;
  deathNumber: number;
  location: string;
  world: string;
  lastWords?: string;
}

@Component({
  selector: 'app-deaths',
  imports: [CommonModule, FormsModule],
  templateUrl: './deaths.html',
  styleUrl: './deaths.css'
})
export class Deaths {
  protected readonly searchQuery = signal('');
  protected readonly sortBy = signal<'deathNumber' | 'day' | 'name'>('deathNumber');

  protected readonly fallenList = signal<FallenWarrior[]>([
    {
      name: 'IzJampi',
      avatar: 'https://minotar.net/helm/IzJampi/120.png',
      cause: 'IzJampi was slain by Zombie',
      day: 1,
      deathNumber: 1,
      location: '5446 -32 455',
      world: 'Over'
    },
    {
      name: 'FL_billiken1905',
      avatar: 'https://minotar.net/helm/FL_billiken1905/120.png',
      cause: 'FL_billiken1905 was slain by Vindicator',
      day: 1,
      deathNumber: 2,
      location: '-3942 126 -2546',
      world: 'Over'
    },
    {
      name: 'Sebasfs128_',
      avatar: 'https://minotar.net/helm/Sebasfs128_/120.png',
      cause: 'Sebasfs128_ was blown up by Creeper',
      day: 1,
      deathNumber: 3,
      location: '3077 135 3831',
      world: 'Over'
    },
    {
      name: 'xanderssss',
      avatar: 'https://minotar.net/helm/xanderssss/120.png',
      cause: 'xanderssss was impaled on a stalagmite',
      day: 2,
      deathNumber: 4,
      location: '-2613 -45 1826',
      world: 'Over'
    },
    {
      name: 'Caubet',
      avatar: 'https://minotar.net/helm/Caubet/120.png',
      cause: 'Caubet fell from a high place',
      day: 2,
      deathNumber: 5,
      location: '3 68 -523',
      world: 'Over'
    },
    {
      name: 'Aaa_OnichanUwU',
      avatar: 'https://minotar.net/helm/Aaa_OnichanUwU/120.png',
      cause: 'Aaa_OnichanUwU was slain by Vindicator',
      day: 2,
      deathNumber: 6,
      location: '765 89 -1505',
      world: 'Over'
    },
    {
      name: 'Imsixito_',
      avatar: 'https://minotar.net/helm/Imsixito_/120.png',
      cause: 'Imsixito_ was slain by Millenary Guard',
      day: 3,
      deathNumber: 7,
      location: '-481 75 4190',
      world: 'Over'
    },
    {
      name: 'Rojeeto',
      avatar: 'https://minotar.net/helm/Rojeeto/120.png',
      cause: 'Rojeeto was blown up by Creeper',
      day: 3,
      deathNumber: 8,
      location: '-767 -2 4728',
      world: 'Over'
    },
    {
      name: 'LechugaMC',
      avatar: 'https://minotar.net/helm/LechugaMC/120.png',
      cause: 'LechugaMC was slain by Millenary Golem',
      day: 3,
      deathNumber: 9,
      location: '-452 85 4172',
      world: 'Over'
    },
    {
      name: 'Darkvid',
      avatar: 'https://minotar.net/helm/Darkvid/120.png',
      cause: 'Darkvid was slain by Millenary Golem',
      day: 3,
      deathNumber: 10,
      location: '-452 84 4176',
      world: 'Over'
    },
    {
      name: 'Jzree',
      avatar: 'https://minotar.net/helm/Jzree/120.png',
      cause: 'Jzree was slain by Millenary Golem',
      day: 3,
      deathNumber: 11,
      location: '-498 75 549',
      world: 'Over'
    },
    {
      name: 'Souther55',
      avatar: 'https://minotar.net/helm/Souther55/120.png',
      cause: 'Souther55 was slain by Iron Golem',
      day: 3,
      deathNumber: 12,
      location: '-790 72 4364',
      world: 'Over'
    },
    {
      name: 'WynautSGP',
      avatar: 'https://minotar.net/helm/WynautSGP/120.png',
      cause: 'WynautSGP was slain by Wasted Walker',
      day: 3,
      deathNumber: 13,
      location: '1909 88 1923',
      world: 'Over'
    },
    {
      name: 'RolexHK',
      avatar: 'https://minotar.net/helm/RolexHK/120.png',
      cause: 'RolexHK fell off a ladder',
      day: 3,
      deathNumber: 14,
      location: '1957 27 -412',
      world: 'Over'
    },
    {
      name: 'MailsBowi',
      avatar: 'https://minotar.net/helm/MailsBowi/120.png',
      cause: 'MailsBowi was blown up by Nebula Creeper',
      day: 3,
      deathNumber: 15,
      location: '5065 64 3394',
      world: 'Over',
      lastWords: 'Buenos días, buenas tardes y buenas noches'
    },
    {
      name: 'ItsNG266',
      avatar: 'https://minotar.net/helm/ItsNG266/120.png',
      cause: 'ItsNG266 blew up',
      day: 4,
      deathNumber: 16,
      location: '3309 71 3513',
      world: 'Over'
    },
    {
      name: 'haloner7',
      avatar: 'https://minotar.net/helm/haloner7/120.png',
      cause: 'haloner7 blew up',
      day: 4,
      deathNumber: 17,
      location: '34 43 -624',
      world: 'Over'
    },
    {
      name: 'Benjaaaah',
      avatar: 'https://minotar.net/helm/Benjaaaah/120.png',
      cause: 'Benjaaaah was slain by Assasin Piglin',
      day: 4,
      deathNumber: 18,
      location: '99 57 -533',
      world: 'Nether',
      lastWords: 'Puto el que muere despues de mi...'
    }
  ]);

  protected readonly filteredFallen = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sort = this.sortBy();

    let list = this.fallenList().filter(warrior => 
      warrior.name.toLowerCase().includes(query) || 
      warrior.cause.toLowerCase().includes(query) || 
      (warrior.lastWords && warrior.lastWords.toLowerCase().includes(query))
    );

    if (sort === 'deathNumber') {
      list = list.sort((a, b) => a.deathNumber - b.deathNumber);
    } else if (sort === 'day') {
      list = list.sort((a, b) => a.day - b.day || a.deathNumber - b.deathNumber);
    } else {
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
    this.sortBy.set(selectElement.value as 'deathNumber' | 'day' | 'name');
  }
}
