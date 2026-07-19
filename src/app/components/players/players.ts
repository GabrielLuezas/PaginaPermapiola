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
    },
    {
      id: 12,
      name: 'Tanda 12',
      image: 'images/grupo12.png',
      revealed: false,
      revealDate: 'Tanda 12',
      members: [
        { name: 'suuupernatural', role: 'Participante', avatar: 'https://minotar.net/helm/suuupernatural/64.png' },
        { name: 'Lelielwaffen', role: 'Participante', avatar: 'https://minotar.net/helm/Lelielwaffen/64.png' },
        { name: 'draquin_', role: 'Participante', avatar: 'https://minotar.net/helm/draquin_/64.png' }
      ]
    },
    {
      id: 13,
      name: 'Tanda 13',
      image: 'images/grupo13.png',
      revealed: false,
      revealDate: 'Tanda 13',
      members: [
        { name: 'hencerio', role: 'Participante', avatar: 'https://minotar.net/helm/hencerio/64.png' },
        { name: 'Evancini67', role: 'Participante', avatar: 'https://minotar.net/helm/Evancini67/64.png' },
        { name: 'Ju4nzz', role: 'Participante', avatar: 'https://minotar.net/helm/Ju4nzz/64.png' }
      ]
    },
    {
      id: 14,
      name: 'Tanda 14',
      image: 'images/grupo14.png',
      revealed: false,
      revealDate: 'Tanda 14',
      members: [
        { name: 'sswwtyy', role: 'Participante', avatar: 'https://minotar.net/helm/sswwtyy/64.png' },
        { name: 'Yermi764', role: 'Participante', avatar: 'https://minotar.net/helm/Yermi764/64.png' },
        { name: 'TTVjustyorch_', role: 'Participante', avatar: 'https://minotar.net/helm/TTVjustyorch_/64.png' }
      ]
    },
    {
      id: 15,
      name: 'Tanda 15',
      image: 'images/grupo15.png',
      revealed: false,
      revealDate: 'Tanda 15',
      members: [
        { name: 'SnowieFlqre', role: 'Participante', avatar: 'https://minotar.net/helm/SnowieFlqre/64.png' },
        { name: 'Gargo6y6', role: 'Participante', avatar: 'https://minotar.net/helm/Gargo6y6/64.png' },
        { name: 'Ks100_', role: 'Participante', avatar: 'https://minotar.net/helm/Ks100_/64.png' },
        { name: 'SuprameKiller', role: 'Participante', avatar: 'https://minotar.net/helm/SuprameKiller/64.png' },
        { name: 'Lalodragod5', role: 'Participante', avatar: 'https://minotar.net/helm/Lalodragod5/64.png' }
      ]
    },
    {
      id: 16,
      name: 'Tanda 16',
      image: 'images/grupo16.png',
      revealed: false,
      revealDate: 'Tanda 16',
      members: [
        { name: 'BanterAcee', role: 'Participante', avatar: 'https://minotar.net/helm/BanterAcee/64.png' },
        { name: 'Secreto_Angel', role: 'Participante', avatar: 'https://minotar.net/helm/Secreto_Angel/64.png' },
        { name: 'BlessedYagoo', role: 'Participante', avatar: 'https://minotar.net/helm/BlessedYagoo/64.png' },
        { name: 'TheDexant', role: 'Participante', avatar: 'https://minotar.net/helm/TheDexant/64.png' },
        { name: 'Darkalex56', role: 'Participante', avatar: 'https://minotar.net/helm/Darkalex56/64.png' }
      ]
    },
    {
      id: 17,
      name: 'Tanda 17',
      image: 'images/grupo17.png',
      revealed: false,
      revealDate: 'Tanda 17',
      members: [
        { name: 'GiovanniLuigini', role: 'Participante', avatar: 'https://minotar.net/helm/GiovanniLuigini/64.png' },
        { name: 'dhexther', role: 'Participante', avatar: 'https://minotar.net/helm/dhexther/64.png' },
        { name: 'xxanders', role: 'Participante', avatar: 'https://minotar.net/helm/xxanders/64.png' }
      ]
    },
    {
      id: 18,
      name: 'Tanda 18',
      image: 'images/grupo18.png',
      revealed: false,
      revealDate: 'Tanda 18',
      members: [
        { name: 'lvxzz_', role: 'Participante', avatar: 'https://minotar.net/helm/lvxzz_/64.png' },
        { name: 'm4xp33ly', role: 'Participante', avatar: 'https://minotar.net/helm/m4xp33ly/64.png' },
        { name: 'Erricherx_XZ', role: 'Participante', avatar: 'https://minotar.net/helm/Erricherx_XZ/64.png' }
      ]
    },
    {
      id: 19,
      name: 'Tanda 19',
      image: 'images/grupo19.png',
      revealed: false,
      revealDate: 'Tanda 19',
      members: [
        { name: 'RoaminBarcade', role: 'Participante', avatar: 'https://minotar.net/helm/RoaminBarcade/64.png' },
        { name: 'Caubet', role: 'Participante', avatar: 'https://minotar.net/helm/Caubet/64.png' },
        { name: 'Anckroyd', role: 'Participante', avatar: 'https://minotar.net/helm/Ancroyd/64.png' },
        { name: 'VtrHater', role: 'Participante', avatar: 'https://minotar.net/helm/VtrHater/64.png' }
      ]
    },
    {
      id: 20,
      name: 'Tanda 20',
      image: 'images/grupo20.png',
      revealed: false,
      revealDate: 'Tanda 20',
      members: [
        { name: 'Cekita', role: 'Participante', avatar: 'https://minotar.net/helm/Cekita/64.png' },
        { name: 'Drogapult', role: 'Participante', avatar: 'https://minotar.net/helm/Drogapult/64.png' },
        { name: 'daniel3865', role: 'Participante', avatar: 'https://minotar.net/helm/daniel3865/64.png' }
      ]
    },
    {
      id: 21,
      name: 'Tanda 21',
      image: 'images/grupo21.png',
      revealed: false,
      revealDate: 'Tanda 21',
      members: [
        { name: 'spoontify', role: 'Participante', avatar: 'https://minotar.net/helm/spoontify/64.png' },
        { name: 'RolexHK', role: 'Participante', avatar: 'https://minotar.net/helm/RolexHK/64.png' },
        { name: 'DJNacho248', role: 'Participante', avatar: 'https://minotar.net/helm/DJNacho248/64.png' }
      ]
    },
    {
      id: 22,
      name: 'Tanda 22',
      image: 'images/grupo22.png',
      revealed: false,
      revealDate: 'Tanda 22',
      members: [
        { name: 'Dexby2006', role: 'Participante', avatar: 'https://minotar.net/helm/Dexby2006/64.png' },
        { name: 'buxworld', role: 'Participante', avatar: 'https://minotar.net/helm/buxworld/64.png' },
        { name: 'AfterDarkside', role: 'Participante', avatar: 'https://minotar.net/helm/AfterDarkside/64.png' }
      ]
    },
    {
      id: 23,
      name: 'Tanda 23',
      image: 'images/grupo23.png',
      revealed: false,
      revealDate: 'Tanda 23',
      members: [
        { name: 'pkns', role: 'Participante', avatar: 'https://minotar.net/helm/pkns/64.png' },
        { name: 'johan2426', role: 'Participante', avatar: 'https://minotar.net/helm/johan2426/64.png' },
        { name: 'alfredito33', role: 'Participante', avatar: 'https://minotar.net/helm/alfredito33/64.png' },
        { name: 'Lucas_Speed', role: 'Participante', avatar: 'https://minotar.net/helm/Lucas_Speed/64.png' },
        { name: 'MrSeta', role: 'Participante', avatar: 'https://minotar.net/helm/MrSeta/64.png' }
      ]
    },
    {
      id: 24,
      name: 'Tanda 24',
      image: 'images/grupo24.png',
      revealed: false,
      revealDate: 'Tanda 24',
      members: [
        { name: 'minicirdy', role: 'Participante', avatar: 'https://minotar.net/helm/minicirdy/64.png' },
        { name: 'Wrygames', role: 'Participante', avatar: 'https://minotar.net/helm/Wrygames/64.png' },
        { name: 'KartanaGX', role: 'Participante', avatar: 'https://minotar.net/helm/KartanaGX/64.png' },
        { name: 'Manugg', role: 'Participante', avatar: 'https://minotar.net/helm/Manugg/64.png' },
        { name: 'MiniYisus', role: 'Participante', avatar: 'https://minotar.net/helm/MiniYisus/64.png' }
      ]
    },
    {
      id: 25,
      name: 'Tanda 25',
      image: 'images/grupo25.png',
      revealed: false,
      revealDate: 'Tanda 25',
      members: [
        { name: 'xanahny', role: 'Participante', avatar: 'https://minotar.net/helm/xanahny/64.png' },
        { name: 'teeix_', role: 'Participante', avatar: 'https://minotar.net/helm/teeix_/64.png' },
        { name: 'PokeRub_24', role: 'Participante', avatar: 'https://minotar.net/helm/PokeRub_24/64.png' },
        { name: 'Raining__', role: 'Participante', avatar: 'https://minotar.net/helm/Raining__/64.png' },
        { name: 'rod_mz', role: 'Participante', avatar: 'https://minotar.net/helm/rod_mz/64.png' }
      ]
    },
    {
      id: 26,
      name: 'Tanda 26',
      image: 'images/grupo26.png',
      revealed: false,
      revealDate: 'Tanda 26',
      members: [
        { name: '_Chochi_', role: 'Participante', avatar: 'https://minotar.net/helm/_Chochi_/64.png' },
        { name: 'goge2', role: 'Participante', avatar: 'https://minotar.net/helm/goge2/64.png' },
        { name: 'PfeFYx', role: 'Participante', avatar: 'https://minotar.net/helm/PfeFYx/64.png' },
        { name: 'Feruk0i_', role: 'Participante', avatar: 'https://minotar.net/helm/Feruk0i_/64.png' }
      ]
    },
    {
      id: 27,
      name: 'Tanda 27',
      image: 'images/grupo27.png',
      revealed: false,
      revealDate: 'Tanda 27',
      members: [
        { name: 'thiscole', role: 'Participante', avatar: 'https://minotar.net/helm/thiscole/64.png' },
        { name: 'alonso_71', role: 'Participante', avatar: 'https://minotar.net/helm/alonso_71/64.png' },
        { name: 'FenixSkeletonRC', role: 'Participante', avatar: 'https://minotar.net/helm/FenixSkeletonRC/64.png' },
        { name: 'wavemallen7', role: 'Participante', avatar: 'https://minotar.net/helm/wavemallen7/64.png' }
      ]
    },
    {
      id: 28,
      name: 'Tanda 28',
      image: 'images/grupo28.png',
      revealed: false,
      revealDate: 'Tanda 28',
      members: [
        { name: 'GhostiusDeus', role: 'Participante', avatar: 'https://minotar.net/helm/GhostiusDeus/64.png' },
        { name: 'thiscole', role: 'Participante', avatar: 'https://minotar.net/helm/thiscole/64.png' },
        { name: 'virtualyves', role: 'Participante', avatar: 'https://minotar.net/helm/virtualyves/64.png' },
        { name: 'ArchivosStarman', role: 'Participante', avatar: 'https://minotar.net/helm/ArchivosStarman/64.png' },
        { name: 'Topunito', role: 'Participante', avatar: 'https://minotar.net/helm/Topunito/64.png' }
      ]
    },
    {
      id: 29,
      name: 'Tanda 29',
      image: 'images/grupo29.png',
      revealed: false,
      revealDate: 'Tanda 29',
      members: [
        { name: 'Lex_ico', role: 'Participante', avatar: 'https://minotar.net/helm/Lex_ico/64.png' },
        { name: 'NotCata', role: 'Participante', avatar: 'https://minotar.net/helm/NotCata/64.png' },
        { name: 'Mitro_86', role: 'Participante', avatar: 'https://minotar.net/helm/Mitro_86/64.png' },
        { name: 'PumPK1inG', role: 'Participante', avatar: 'https://minotar.net/helm/PumPK1inG/64.png' },
        { name: 'The_Nobb', role: 'Participante', avatar: 'https://minotar.net/helm/The_Nobb/64.png' }
      ]
    },
    {
      id: 30,
      name: 'Tanda 30',
      image: 'images/grupo30.png',
      revealed: false,
      revealDate: 'Tanda 30',
      members: [
        { name: 'microvevo', role: 'Participante', avatar: 'https://minotar.net/helm/microvevo/64.png' },
        { name: 'Tondergames7', role: 'Participante', avatar: 'https://minotar.net/helm/Tondergames7/64.png' },
        { name: 'ImFalsee_', role: 'Participante', avatar: 'https://minotar.net/helm/ImFalsee_/64.png' },
        { name: 'Winder_Gamer', role: 'Participante', avatar: 'https://minotar.net/helm/Winder_Gamer/64.png' },
        { name: 'Zaipy', role: 'Participante', avatar: 'https://minotar.net/helm/Zaipy/64.png' }
      ]
    },
    {
      id: 31,
      name: 'Tanda 31',
      image: 'images/grupo31.png',
      revealed: false,
      revealDate: 'Tanda 31',
      members: [
        { name: 'MarkManFlame_55', role: 'Participante', avatar: 'https://minotar.net/helm/MarkManFlame_55/64.png' },
        { name: 'fisureti', role: 'Participante', avatar: 'https://minotar.net/helm/fisureti/64.png' },
        { name: 'samurdok', role: 'Participante', avatar: 'https://minotar.net/helm/samurdok/64.png' },
        { name: 'Miguel_Soap', role: 'Participante', avatar: 'https://minotar.net/helm/Miguel_Soap/64.png' },
        { name: 'ElTormentoXD', role: 'Participante', avatar: 'https://minotar.net/helm/ElTormentoXD/64.png' }
      ]
    },
    {
      id: 32,
      name: 'Tanda 32',
      image: 'images/grupo32.png',
      revealed: false,
      revealDate: 'Tanda 32',
      members: [
        { name: 'Eideh', role: 'Participante', avatar: 'https://minotar.net/helm/Eideh/64.png' },
        { name: 'TotoCapo398', role: 'Participante', avatar: 'https://minotar.net/helm/TotoCapo398/64.png' },
        { name: 'Crssss_', role: 'Participante', avatar: 'https://minotar.net/helm/Crssss_/64.png' },
        { name: 'Serevyn', role: 'Participante', avatar: 'https://minotar.net/helm/Serevyn/64.png' },
        { name: 'alexics', role: 'Participante', avatar: 'https://minotar.net/helm/alexics/64.png' }
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

            // Tanda 12, 13 y 14 → a las 48h (interval >= 4)
            if ((group.id === 12 || group.id === 13 || group.id === 14) && intervals >= 4) isRevealed = true;

            // Tanda 15, 16, 17 y 18 → a las 60h (interval >= 5)
            if ((group.id === 15 || group.id === 16 || group.id === 17 || group.id === 18) && intervals >= 5) isRevealed = true;

            // Tanda 19, 20, 21 y 22 → a las 72h (interval >= 6)
            if ((group.id === 19 || group.id === 20 || group.id === 21 || group.id === 22) && intervals >= 6) isRevealed = true;

            // Tanda 23 y 24 → a las 84h (interval >= 7 / en 20 min)
            if ((group.id === 23 || group.id === 24) && intervals >= 7) isRevealed = true;

            // Tanda 25, 26 y 27 → a las 96h (interval >= 8 / 12h después)
            if ((group.id === 25 || group.id === 26 || group.id === 27) && intervals >= 8) isRevealed = true;

            // Tanda 28, 29 y 30 → a las 108h (interval >= 9 / en 25 min)
            if ((group.id === 28 || group.id === 29 || group.id === 30) && intervals >= 9) isRevealed = true;

            // Tanda 31 y 32 → a las 120h (interval >= 10 / en 20 min)
            if ((group.id === 31 || group.id === 32) && intervals >= 10) isRevealed = true;
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
