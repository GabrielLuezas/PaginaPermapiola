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
    },
    {
      name: 'Lex_ico',
      avatar: 'https://minotar.net/helm/Lex_ico/120.png',
      cause: 'Lex_ico was slain by Millenary Golem',
      day: 4,
      deathNumber: 21,
      location: '-4999 89 -6919',
      world: 'Over'
    },
    {
      name: 'TotoCapo398',
      avatar: 'https://minotar.net/helm/TotoCapo398/120.png',
      cause: 'TotoCapo398 was slain by Vex',
      day: 5,
      deathNumber: 22,
      location: '1389 63 -1890',
      world: 'Over'
    },
    {
      name: 'thiscole',
      avatar: 'https://minotar.net/helm/thiscole/120.png',
      cause: 'thiscole was doomed to fall by Nightmare Archer',
      day: 5,
      deathNumber: 23,
      location: '-3816 76 4962',
      world: 'Over',
      lastWords: 'murio el mejor jugador de este servidor ARRIBA PERU Y ARRIBA ALIANZA TLV'
    },
    {
      name: 'Rafismo',
      avatar: 'https://minotar.net/helm/Rafismo/120.png',
      cause: 'Rafismo was shot by Emperor Archer',
      day: 5,
      deathNumber: 24,
      location: '-580 95 1966',
      world: 'Over',
      lastWords: 'UNANSE AL RAFISMO'
    },
    {
      name: 'Anckroyd',
      avatar: 'https://minotar.net/helm/Anckroyd/120.png',
      cause: 'Anckroyd was slain by Millenary Golem',
      day: 5,
      deathNumber: 25,
      location: '-5568 255 -6553',
      world: 'Over'
    },
    {
      name: 'RebelAndrew',
      avatar: 'https://minotar.net/helm/RebelAndrew/120.png',
      cause: 'RebelAndrew was blown up by Solar Creeper',
      day: 5,
      deathNumber: 26,
      location: '734 100 -1577',
      world: 'Over'
    },
    {
      name: 'AmadeoBordiga',
      avatar: 'https://minotar.net/helm/AmadeoBordiga/120.png',
      cause: 'AmadeoBordiga was slain by Millenary Golem',
      day: 6,
      deathNumber: 26,
      location: '3602 100 3768',
      world: 'Over',
      lastWords: 'hh'
    },
    {
      name: 'Asphyxxia_',
      avatar: 'https://minotar.net/helm/Asphyxxia_/120.png',
      cause: 'Asphyxxia_ was slain by Millenary Golem',
      day: 6,
      deathNumber: 27,
      location: '7013 117 -6965',
      world: 'Over'
    },
    {
      name: 'rod_mz',
      avatar: 'https://minotar.net/helm/rod_mz/120.png',
      cause: 'rod_mz was slain by Piglin Brute',
      day: 6,
      deathNumber: 28,
      location: '-2503 95 -2126',
      world: 'Over'
    },
    {
      name: 'beennji',
      avatar: 'https://minotar.net/helm/beennji/120.png',
      cause: 'beennji was slain by Piglin Brute',
      day: 6,
      deathNumber: 29,
      location: '-400 107 721',
      world: 'Over',
      lastWords: '67 67'
    },
    {
      name: 'sthefano',
      avatar: 'https://minotar.net/helm/sthefano/120.png',
      cause: 'sthefano was slain by Piglin Brute',
      day: 6,
      deathNumber: 30,
      location: '-518 106 717',
      world: 'Over'
    },
    {
      name: 'Winder_Gamer',
      avatar: 'https://minotar.net/helm/Winder_Gamer/120.png',
      cause: 'Winder_Gamer murió por inactividad',
      day: 6,
      deathNumber: 31,
      location: '-14 75 -14',
      world: 'Over'
    },
    {
      name: 'Folklor',
      avatar: 'https://minotar.net/helm/Folklor/120.png',
      cause: 'Folklor murió por inactividad',
      day: 6,
      deathNumber: 32,
      location: '1150 -44 -1018',
      world: 'Over'
    },
    {
      name: 'cirocasta_',
      avatar: 'https://minotar.net/helm/cirocasta_/120.png',
      cause: 'cirocasta_ was slain by Piglin Brute',
      day: 7,
      deathNumber: 35,
      location: '-433 128 2321',
      world: 'Over',
      lastWords: 'si fl si saccy'
    },
    {
      name: 'rSapphire_',
      avatar: 'https://minotar.net/helm/rSapphire_/120.png',
      cause: 'rSapphire_ was slain by Scorched Piglin',
      day: 7,
      deathNumber: 37,
      location: '475 15 -113',
      world: 'Nether',
      lastWords: 'se fue a paraguay'
    },
    {
      name: 'Miguel_Soap',
      avatar: 'https://minotar.net/helm/Miguel_Soap/120.png',
      cause: 'Miguel_Soap was slain by Piglin Brute',
      day: 7,
      deathNumber: 38,
      location: '2462 97 5499',
      world: 'Over',
      lastWords: 'Ha muerto porque la neta esa niña lo traía cacheteando las banquetas bien masiso acá'
    },
    {
      name: 'Topunito',
      avatar: 'https://minotar.net/helm/Topunito/120.png',
      cause: 'Topunito was slain by Piglin Brute',
      day: 7,
      deathNumber: 37,
      location: '558 71 2483',
      world: 'Over'
    },
    {
      name: 'itzKira811',
      avatar: 'https://minotar.net/helm/itzKira811/120.png',
      cause: 'itzKira811 fell from a high place',
      day: 8,
      deathNumber: 38,
      location: '-1412 63 -1121',
      world: 'Over',
      lastWords: 'No tenia netherite para picar ni monda'
    },
    {
      name: 'jaiba12',
      avatar: 'https://minotar.net/helm/jaiba12/120.png',
      cause: 'jaiba12 was slain by Magma Cube',
      day: 8,
      deathNumber: 39,
      location: '671 92 2501',
      world: 'Over',
      lastWords: "Mis ganas de pensar donde las jaibas existen sera en el mañana... (i'm old)"
    },
    {
      name: 'buxworld',
      avatar: 'https://minotar.net/helm/buxworld/120.png',
      cause: 'buxworld was slain by Goth',
      day: 8,
      deathNumber: 40,
      location: '9983 267 -149',
      world: 'Over'
    },
    {
      name: 'AfterDarkside',
      avatar: 'https://minotar.net/helm/AfterDarkside/120.png',
      cause: 'AfterDarkside died',
      day: 8,
      deathNumber: 41,
      location: '9983 266 -158',
      world: 'Over'
    },
    {
      name: 'goge2',
      avatar: 'https://minotar.net/helm/goge2/120.png',
      cause: 'goge2 died',
      day: 8,
      deathNumber: 46,
      location: '10018 266 -226',
      world: 'Over',
      lastWords: 'misenba me piolo con gabrielucifer en la dungeon'
    },
    {
      name: 'MadeByKinda',
      avatar: 'https://minotar.net/helm/MadeByKinda/120.png',
      cause: 'MadeByKinda died',
      day: 8,
      deathNumber: 47,
      location: '9997 266 -192',
      world: 'Over'
    },
    {
      name: 'Jirowoo',
      avatar: 'https://minotar.net/helm/Jirowoo/120.png',
      cause: 'Jirowoo was killed',
      day: 8,
      deathNumber: 48,
      location: '-11 63 330',
      world: 'Over',
      lastWords: 'gg me aburri'
    },
    {
      name: 'THEmacuin',
      avatar: 'https://minotar.net/helm/THEmacuin/120.png',
      cause: 'THEmacuin was struck by lightning',
      day: 8,
      deathNumber: 45,
      location: '-1628 64 -1130',
      world: 'Over'
    },
    {
      name: 'HjMateo_',
      avatar: 'https://minotar.net/helm/HjMateo_/120.png',
      cause: 'HjMateo_ was slain by Spider',
      day: 8,
      deathNumber: 45,
      location: '-2354 99 495',
      world: 'Over',
      lastWords: 'me mori'
    },
    {
      name: 'jonh5763',
      avatar: 'https://minotar.net/helm/jonh5763/120.png',
      cause: 'jonh5763 died',
      day: 10,
      deathNumber: 48,
      location: '-3794 68 -4854',
      world: 'Over',
      lastWords: 'adios papus'
    },
    {
      name: 'GhostiusDeus',
      avatar: 'https://minotar.net/helm/GhostiusDeus/120.png',
      cause: 'GhostiusDeus murió por inactividad',
      day: 10,
      deathNumber: 50,
      location: '1841 76 2401',
      world: 'Over'
    },
    {
      name: 'Mitro_86',
      avatar: 'https://minotar.net/helm/Mitro_86/120.png',
      cause: 'Mitro_86 murió por inactividad',
      day: 11,
      deathNumber: 51,
      location: '-5932 78 -1528',
      world: 'Over'
    },
    {
      name: 'TommyGiordano',
      avatar: 'https://minotar.net/helm/TommyGiordano/120.png',
      cause: 'TommyGiordano blew up',
      day: 11,
      deathNumber: 52,
      location: '1266 6 -55',
      world: 'Over',
      lastWords: 'Mi talento me ha llevado lejos, demasiado lejos para este punto, pero hasta el Diego tuvo que frenar en su día. Gracias a todos.'
    },
    {
      name: 'Nathalex_TV',
      avatar: 'https://minotar.net/helm/Nathalex_TV/120.png',
      cause: 'Nathalex_TV murió por inactividad',
      day: 11,
      deathNumber: 53,
      location: '750 89 -1487',
      world: 'Over',
      lastWords: 'se ha corrido fuertemente'
    },
    {
      name: 'draquin_',
      avatar: 'https://minotar.net/helm/draquin_/120.png',
      cause: 'draquin_ was slain by Vindicator',
      day: 11,
      deathNumber: 53,
      location: '-2522 115 5350',
      world: 'Over',
      lastWords: 'i need keke'
    },
    {
      name: 'Manuasdgg',
      avatar: 'https://minotar.net/helm/Manuasdgg/120.png',
      cause: 'Manuasdgg murió por inactividad',
      day: 11,
      deathNumber: 54,
      location: '-770 80 4393',
      world: 'Over'
    },
    {
      name: 'Eideh',
      avatar: 'https://minotar.net/helm/Eideh/120.png',
      cause: 'Eideh blew up',
      day: 12,
      deathNumber: 56,
      location: '1950 66 -976',
      world: 'Over'
    },
    {
      name: 'suuupernatural',
      avatar: 'https://minotar.net/helm/suuupernatural/120.png',
      cause: 'suuupernatural murió por inactividad',
      day: 12,
      deathNumber: 57,
      location: '-3273 43 -1158',
      world: 'Over',
      lastWords: 'SI FL SI SACCY'
    },
    {
      name: 'pkns',
      avatar: 'https://minotar.net/helm/pkns/120.png',
      cause: 'pkns murió por inactividad',
      day: 12,
      deathNumber: 58,
      location: '-1768 71 -184',
      world: 'Over'
    },
    {
      name: 'TitanioTi',
      avatar: 'https://minotar.net/helm/TitanioTi/120.png',
      cause: 'TitanioTi murió por inactividad',
      day: 12,
      deathNumber: 58,
      location: '-1032 123 -2631',
      world: 'Over',
      lastWords: 'No se cuidó el cipote, ahora regresa a trabajar en su video'
    },
    {
      name: 'Paco151',
      avatar: 'https://minotar.net/helm/Paco151/120.png',
      cause: 'Paco151 was blown up by Cryptic Wailer',
      day: 12,
      deathNumber: 59,
      location: '2009 29 3415',
      world: 'Over',
      lastWords: 'miaw'
    },
    {
      name: 'alexics',
      avatar: 'https://minotar.net/helm/alexics/120.png',
      cause: 'alexics murió por inactividad',
      day: 13,
      deathNumber: 60,
      location: '1266 91 -828',
      world: 'Over'
    },
    {
      name: 'dhexther',
      avatar: 'https://minotar.net/helm/dhexther/120.png',
      cause: 'dhexther was slain by Cryptic Walker',
      day: 13,
      deathNumber: 61,
      location: '-7452 26 7583',
      world: 'Over'
    },
    {
      name: 'microvevo',
      avatar: 'https://minotar.net/helm/microvevo/120.png',
      cause: 'microvevo was blown up by Cryptic Wailer',
      day: 13,
      deathNumber: 61,
      location: '-1796 23 -2814',
      world: 'Over',
      lastWords: 'SOY IMBECIL'
    },
    {
      name: 'alfredito33',
      avatar: 'https://minotar.net/helm/alfredito33/120.png',
      cause: 'alfredito33 was slain by Cryptic Walker',
      day: 13,
      deathNumber: 62,
      location: '-1835 21 -2948',
      world: 'Over'
    },
    {
      name: 'RebelAndrew',
      avatar: 'https://minotar.net/helm/RebelAndrew/120.png',
      cause: 'RebelAndrew was slain by Vindicator',
      day: 13,
      deathNumber: 63,
      location: '2670 71 5286',
      world: 'Over',
      lastWords: 'que gran show'
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
