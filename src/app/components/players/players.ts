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
      image: 'images/grupo1.webp',
      revealed: false,
      revealDate: 'Tanda 1',
      members: [
        { name: 'comertetass', role: 'Participante', avatar: 'https://minotar.net/helm/comertetass/64.webp' },
        { name: 'yohiXD', role: 'Participante', avatar: 'https://minotar.net/helm/yohiXD/64.webp' },
        { name: 'QueTontoLeny', role: 'Participante', avatar: 'https://minotar.net/helm/QueTontoLeny/64.webp' },
        { name: '_ZoshI_', role: 'Participante', avatar: 'https://minotar.net/helm/_ZoshI_/64.webp' }
      ]
    },
    {
      id: 2,
      name: 'Tanda 2',
      image: 'images/grupo2.webp',
      revealed: false,
      revealDate: 'Tanda 2',
      members: [
        { name: 'ShadowExx', role: 'Participante', avatar: 'https://minotar.net/helm/ShadowExx/64.webp' },
        { name: 'proxing33', role: 'Participante', avatar: 'https://minotar.net/helm/proxing33/64.webp' },
        { name: 'GabrielLucifer22', role: 'Participante', avatar: 'https://minotar.net/helm/GabrielLucifer22/64.webp' }
      ]
    },
    {
      id: 3,
      name: 'Tanda 3',
      image: 'images/grupo3.webp',
      revealed: false,
      revealDate: 'Tanda 3',
      members: [
        { name: 'ItsNG266', role: 'Participante', avatar: 'https://minotar.net/helm/ItsNG266/64.webp' },
        { name: 'MACUM', role: 'Participante', avatar: 'https://minotar.net/helm/MACUM/64.webp' },
        { name: 'S_Stark', role: 'Participante', avatar: 'https://minotar.net/helm/S_Stark/64.webp' }
      ]
    },
    {
      id: 4,
      name: 'Tanda 4',
      image: 'images/grupo4.webp',
      revealed: false,
      revealDate: 'Tanda 4',
      members: [
        { name: 'rShapphire', role: 'Participante', avatar: 'https://minotar.net/helm/rShapphire/64.webp' },
        { name: 'Benjaaaah', role: 'Participante', avatar: 'https://minotar.net/helm/Benjaaaah/64.webp' },
        { name: 'jdromero1011', role: 'Participante', avatar: 'https://minotar.net/helm/jdromero1011/64.webp' }
      ]
    },
    {
      id: 5,
      name: 'Tanda 5',
      image: 'images/grupo5.webp',
      revealed: false,
      revealDate: 'Tanda 5',
      members: [
        { name: 'ImNate987_', role: 'Participante', avatar: 'https://minotar.net/helm/ImNate987_/64.webp' },
        { name: 'iBeenji', role: 'Participante', avatar: 'https://minotar.net/helm/iBeenji/64.webp' },
        { name: 'PeruvianMaster69', role: 'Participante', avatar: 'https://minotar.net/helm/PeruvianMaster69/64.webp' }
      ]
    },
    {
      id: 6,
      name: 'Tanda 6',
      image: 'images/grupo6.webp',
      revealed: false,
      revealDate: 'Tanda 6',
      members: [
        { name: 'Dunao_', role: 'Participante', avatar: 'https://minotar.net/helm/Dunao_/64.webp' },
        { name: 'SuperMiGamer003', role: 'Participante', avatar: 'https://minotar.net/helm/SuperMiGamer003/64.webp' },
        { name: 'CarolBlazing', role: 'Participante', avatar: 'https://minotar.net/helm/CarolBlazing/64.webp' },
        { name: 'itzKira811', role: 'Participante', avatar: 'https://minotar.net/helm/itzKira811/64.webp' },
        { name: 'Elplatanero_', role: 'Participante', avatar: 'https://minotar.net/helm/Elplatanero_/64.webp' }
      ]
    },
    {
      id: 7,
      name: 'Tanda 7',
      image: 'images/grupo7.webp',
      revealed: false,
      revealDate: 'Tanda 7',
      members: [
        { name: 'hdlux', role: 'Participante', avatar: 'https://minotar.net/helm/hdlux/64.webp' },
        { name: 'jaiba12', role: 'Participante', avatar: 'https://minotar.net/helm/jaiba12/64.webp' },
        { name: 'MadeByKinda', role: 'Participante', avatar: 'https://minotar.net/helm/MadeByKinda/64.webp' }
      ]
    },
    {
      id: 8,
      name: 'Tanda 8',
      image: 'images/grupo8.webp',
      revealed: false,
      revealDate: 'Tanda 8',
      members: [
        { name: 'TheBasty257', role: 'Participante', avatar: 'https://minotar.net/helm/TheBasty257/64.webp' },
        { name: 'EchiTimeYT', role: 'Participante', avatar: 'https://minotar.net/helm/EchiTimeYT/64.webp' },
        { name: 'SrInteligencia', role: 'Participante', avatar: 'https://minotar.net/helm/SrInteligencia/64.webp' }
      ]
    },
    {
      id: 9,
      name: 'Tanda 9',
      image: 'images/grupo9.webp',
      revealed: false,
      revealDate: 'Tanda 9',
      members: [
        { name: 'SlowDeAlex', role: 'Participante', avatar: 'https://minotar.net/helm/SlowDeAlex/64.webp' },
        { name: 'LechugaMC', role: 'Participante', avatar: 'https://minotar.net/helm/LechugaMC/64.webp' },
        { name: 'Aaa_OnichanUwU', role: 'Participante', avatar: 'https://minotar.net/helm/Aaa_OnichanUwU/64.webp' }
      ]
    },
    {
      id: 10,
      name: 'Tanda 10',
      image: 'images/grupo10.webp',
      revealed: false,
      revealDate: 'Tanda 10',
      members: [
        { name: 'Jirowoo', role: 'Participante', avatar: 'https://minotar.net/helm/Jirowoo/64.webp' },
        { name: 'Rafismo', role: 'Participante', avatar: 'https://minotar.net/helm/Rafismo/64.webp' },
        { name: 'ExplosionGIrl', role: 'Participante', avatar: 'https://minotar.net/helm/ExplosionGIrl/64.webp' }
      ]
    },
    {
      id: 11,
      name: 'Tanda 11',
      image: 'images/grupo11.webp',
      revealed: false,
      revealDate: 'Tanda 11',
      members: [
        { name: 'Nataa_', role: 'Participante', avatar: 'https://minotar.net/helm/Nataa_/64.webp' },
        { name: 'MailsBowi', role: 'Participante', avatar: 'https://minotar.net/helm/MailsBowi/64.webp' },
        { name: 'YoniJP1000', role: 'Participante', avatar: 'https://minotar.net/helm/YoniJP1000/64.webp' }
      ]
    },
    {
      id: 12,
      name: 'Tanda 12',
      image: 'images/grupo12.webp',
      revealed: false,
      revealDate: 'Tanda 12',
      members: [
        { name: 'suuupernatural', role: 'Participante', avatar: 'https://minotar.net/helm/suuupernatural/64.webp' },
        { name: 'Lelielwaffen', role: 'Participante', avatar: 'https://minotar.net/helm/Lelielwaffen/64.webp' },
        { name: 'draquin_', role: 'Participante', avatar: 'https://minotar.net/helm/draquin_/64.webp' }
      ]
    },
    {
      id: 13,
      name: 'Tanda 13',
      image: 'images/grupo13.webp',
      revealed: false,
      revealDate: 'Tanda 13',
      members: [
        { name: 'hencerio', role: 'Participante', avatar: 'https://minotar.net/helm/hencerio/64.webp' },
        { name: 'Evancini67', role: 'Participante', avatar: 'https://minotar.net/helm/Evancini67/64.webp' },
        { name: 'Ju4nzz', role: 'Participante', avatar: 'https://minotar.net/helm/Ju4nzz/64.webp' }
      ]
    },
    {
      id: 14,
      name: 'Tanda 14',
      image: 'images/grupo14.webp',
      revealed: false,
      revealDate: 'Tanda 14',
      members: [
        { name: 'sswwtyy', role: 'Participante', avatar: 'https://minotar.net/helm/sswwtyy/64.webp' },
        { name: 'Yermi764', role: 'Participante', avatar: 'https://minotar.net/helm/Yermi764/64.webp' },
        { name: 'TTVjustyorch_', role: 'Participante', avatar: 'https://minotar.net/helm/TTVjustyorch_/64.webp' }
      ]
    },
    {
      id: 15,
      name: 'Tanda 15',
      image: 'images/grupo15.webp',
      revealed: false,
      revealDate: 'Tanda 15',
      members: [
        { name: 'SnowieFlqre', role: 'Participante', avatar: 'https://minotar.net/helm/SnowieFlqre/64.webp' },
        { name: 'Gargo6y6', role: 'Participante', avatar: 'https://minotar.net/helm/Gargo6y6/64.webp' },
        { name: 'Ks100_', role: 'Participante', avatar: 'https://minotar.net/helm/Ks100_/64.webp' },
        { name: 'SuprameKiller', role: 'Participante', avatar: 'https://minotar.net/helm/SuprameKiller/64.webp' },
        { name: 'Lalodragod5', role: 'Participante', avatar: 'https://minotar.net/helm/Lalodragod5/64.webp' }
      ]
    },
    {
      id: 16,
      name: 'Tanda 16',
      image: 'images/grupo16.webp',
      revealed: false,
      revealDate: 'Tanda 16',
      members: [
        { name: 'BanterAcee', role: 'Participante', avatar: 'https://minotar.net/helm/BanterAcee/64.webp' },
        { name: 'Secreto_Angel', role: 'Participante', avatar: 'https://minotar.net/helm/Secreto_Angel/64.webp' },
        { name: 'BlessedYagoo', role: 'Participante', avatar: 'https://minotar.net/helm/BlessedYagoo/64.webp' },
        { name: 'TheDexant', role: 'Participante', avatar: 'https://minotar.net/helm/TheDexant/64.webp' },
        { name: 'Darkalex56', role: 'Participante', avatar: 'https://minotar.net/helm/Darkalex56/64.webp' }
      ]
    },
    {
      id: 17,
      name: 'Tanda 17',
      image: 'images/grupo17.webp',
      revealed: false,
      revealDate: 'Tanda 17',
      members: [
        { name: 'GiovanniLuigini', role: 'Participante', avatar: 'https://minotar.net/helm/GiovanniLuigini/64.webp' },
        { name: 'dhexther', role: 'Participante', avatar: 'https://minotar.net/helm/dhexther/64.webp' },
        { name: 'xxanders', role: 'Participante', avatar: 'https://minotar.net/helm/xxanders/64.webp' }
      ]
    },
    {
      id: 18,
      name: 'Tanda 18',
      image: 'images/grupo18.webp',
      revealed: false,
      revealDate: 'Tanda 18',
      members: [
        { name: 'lvxzz_', role: 'Participante', avatar: 'https://minotar.net/helm/lvxzz_/64.webp' },
        { name: 'm4xp33ly', role: 'Participante', avatar: 'https://minotar.net/helm/m4xp33ly/64.webp' },
        { name: 'Erricherx_XZ', role: 'Participante', avatar: 'https://minotar.net/helm/Erricherx_XZ/64.webp' }
      ]
    },
    {
      id: 19,
      name: 'Tanda 19',
      image: 'images/grupo19.webp',
      revealed: false,
      revealDate: 'Tanda 19',
      members: [
        { name: 'RoaminBarcade', role: 'Participante', avatar: 'https://minotar.net/helm/RoaminBarcade/64.webp' },
        { name: 'Caubet', role: 'Participante', avatar: 'https://minotar.net/helm/Caubet/64.webp' },
        { name: 'Anckroyd', role: 'Participante', avatar: 'https://minotar.net/helm/Ancroyd/64.webp' },
        { name: 'VtrHater', role: 'Participante', avatar: 'https://minotar.net/helm/VtrHater/64.webp' }
      ]
    },
    {
      id: 20,
      name: 'Tanda 20',
      image: 'images/grupo20.webp',
      revealed: false,
      revealDate: 'Tanda 20',
      members: [
        { name: 'Cekita', role: 'Participante', avatar: 'https://minotar.net/helm/Cekita/64.webp' },
        { name: 'Drogapult', role: 'Participante', avatar: 'https://minotar.net/helm/Drogapult/64.webp' },
        { name: 'daniel3865', role: 'Participante', avatar: 'https://minotar.net/helm/daniel3865/64.webp' }
      ]
    },
    {
      id: 21,
      name: 'Tanda 21',
      image: 'images/grupo21.webp',
      revealed: false,
      revealDate: 'Tanda 21',
      members: [
        { name: 'spoontify', role: 'Participante', avatar: 'https://minotar.net/helm/spoontify/64.webp' },
        { name: 'RolexHK', role: 'Participante', avatar: 'https://minotar.net/helm/RolexHK/64.webp' },
        { name: 'DJNacho248', role: 'Participante', avatar: 'https://minotar.net/helm/DJNacho248/64.webp' }
      ]
    },
    {
      id: 22,
      name: 'Tanda 22',
      image: 'images/grupo22.webp',
      revealed: false,
      revealDate: 'Tanda 22',
      members: [
        { name: 'Dexby2006', role: 'Participante', avatar: 'https://minotar.net/helm/Dexby2006/64.webp' },
        { name: 'buxworld', role: 'Participante', avatar: 'https://minotar.net/helm/buxworld/64.webp' },
        { name: 'AfterDarkside', role: 'Participante', avatar: 'https://minotar.net/helm/AfterDarkside/64.webp' }
      ]
    },
    {
      id: 23,
      name: 'Tanda 23',
      image: 'images/grupo23.webp',
      revealed: false,
      revealDate: 'Tanda 23',
      members: [
        { name: 'pkns', role: 'Participante', avatar: 'https://minotar.net/helm/pkns/64.webp' },
        { name: 'johan2426', role: 'Participante', avatar: 'https://minotar.net/helm/johan2426/64.webp' },
        { name: 'alfredito33', role: 'Participante', avatar: 'https://minotar.net/helm/alfredito33/64.webp' },
        { name: 'Lucas_Speed', role: 'Participante', avatar: 'https://minotar.net/helm/Lucas_Speed/64.webp' },
        { name: 'MrSeta', role: 'Participante', avatar: 'https://minotar.net/helm/MrSeta/64.webp' }
      ]
    },
    {
      id: 24,
      name: 'Tanda 24',
      image: 'images/grupo24.webp',
      revealed: false,
      revealDate: 'Tanda 24',
      members: [
        { name: 'minicirdy', role: 'Participante', avatar: 'https://minotar.net/helm/minicirdy/64.webp' },
        { name: 'Wrygames', role: 'Participante', avatar: 'https://minotar.net/helm/Wrygames/64.webp' },
        { name: 'KartanaGX', role: 'Participante', avatar: 'https://minotar.net/helm/KartanaGX/64.webp' },
        { name: 'Manugg', role: 'Participante', avatar: 'https://minotar.net/helm/Manugg/64.webp' },
        { name: 'MiniYisus', role: 'Participante', avatar: 'https://minotar.net/helm/MiniYisus/64.webp' }
      ]
    },
    {
      id: 25,
      name: 'Tanda 25',
      image: 'images/grupo25.webp',
      revealed: false,
      revealDate: 'Tanda 25',
      members: [
        { name: 'xanahny', role: 'Participante', avatar: 'https://minotar.net/helm/xanahny/64.webp' },
        { name: 'teeix_', role: 'Participante', avatar: 'https://minotar.net/helm/teeix_/64.webp' },
        { name: 'PokeRub_24', role: 'Participante', avatar: 'https://minotar.net/helm/PokeRub_24/64.webp' },
        { name: 'Raining__', role: 'Participante', avatar: 'https://minotar.net/helm/Raining__/64.webp' },
        { name: 'rod_mz', role: 'Participante', avatar: 'https://minotar.net/helm/rod_mz/64.webp' }
      ]
    },
    {
      id: 26,
      name: 'Tanda 26',
      image: 'images/grupo26.webp',
      revealed: false,
      revealDate: 'Tanda 26',
      members: [
        { name: '_Chochi_', role: 'Participante', avatar: 'https://minotar.net/helm/_Chochi_/64.webp' },
        { name: 'goge2', role: 'Participante', avatar: 'https://minotar.net/helm/goge2/64.webp' },
        { name: 'PfeFYx', role: 'Participante', avatar: 'https://minotar.net/helm/PfeFYx/64.webp' },
        { name: 'Feruk0i_', role: 'Participante', avatar: 'https://minotar.net/helm/Feruk0i_/64.webp' }
      ]
    },
    {
      id: 27,
      name: 'Tanda 27',
      image: 'images/grupo27.webp',
      revealed: false,
      revealDate: 'Tanda 27',
      members: [
        { name: 'thiscole', role: 'Participante', avatar: 'https://minotar.net/helm/thiscole/64.webp' },
        { name: 'alonso_71', role: 'Participante', avatar: 'https://minotar.net/helm/alonso_71/64.webp' },
        { name: 'FenixSkeletonRC', role: 'Participante', avatar: 'https://minotar.net/helm/FenixSkeletonRC/64.webp' },
        { name: 'wavemallen7', role: 'Participante', avatar: 'https://minotar.net/helm/wavemallen7/64.webp' }
      ]
    },
    {
      id: 28,
      name: 'Tanda 28',
      image: 'images/grupo28.webp',
      revealed: false,
      revealDate: 'Tanda 28',
      members: [
        { name: 'GhostiusDeus', role: 'Participante', avatar: 'https://minotar.net/helm/GhostiusDeus/64.webp' },
        { name: 'thiscole', role: 'Participante', avatar: 'https://minotar.net/helm/thiscole/64.webp' },
        { name: 'virtualyves', role: 'Participante', avatar: 'https://minotar.net/helm/virtualyves/64.webp' },
        { name: 'ArchivosStarman', role: 'Participante', avatar: 'https://minotar.net/helm/ArchivosStarman/64.webp' },
        { name: 'Topunito', role: 'Participante', avatar: 'https://minotar.net/helm/Topunito/64.webp' }
      ]
    },
    {
      id: 29,
      name: 'Tanda 29',
      image: 'images/grupo29.webp',
      revealed: false,
      revealDate: 'Tanda 29',
      members: [
        { name: 'Lex_ico', role: 'Participante', avatar: 'https://minotar.net/helm/Lex_ico/64.webp' },
        { name: 'NotCata', role: 'Participante', avatar: 'https://minotar.net/helm/NotCata/64.webp' },
        { name: 'Mitro_86', role: 'Participante', avatar: 'https://minotar.net/helm/Mitro_86/64.webp' },
        { name: 'PumPK1inG', role: 'Participante', avatar: 'https://minotar.net/helm/PumPK1inG/64.webp' },
        { name: 'The_Nobb', role: 'Participante', avatar: 'https://minotar.net/helm/The_Nobb/64.webp' }
      ]
    },
    {
      id: 30,
      name: 'Tanda 30',
      image: 'images/grupo30.webp',
      revealed: false,
      revealDate: 'Tanda 30',
      members: [
        { name: 'microvevo', role: 'Participante', avatar: 'https://minotar.net/helm/microvevo/64.webp' },
        { name: 'Tondergames7', role: 'Participante', avatar: 'https://minotar.net/helm/Tondergames7/64.webp' },
        { name: 'ImFalse_', role: 'Participante', avatar: 'https://minotar.net/helm/ImFalse_/64.webp' },
        { name: 'Winder_Gamer', role: 'Participante', avatar: 'https://minotar.net/helm/Winder_Gamer/64.webp' },
        { name: 'Zaipy', role: 'Participante', avatar: 'https://minotar.net/helm/Zaipy/64.webp' }
      ]
    },
    {
      id: 31,
      name: 'Tanda 31',
      image: 'images/grupo31.webp',
      revealed: false,
      revealDate: 'Tanda 31',
      members: [
        { name: 'MarkManFlame_55', role: 'Participante', avatar: 'https://minotar.net/helm/MarkManFlame_55/64.webp' },
        { name: 'fisureti', role: 'Participante', avatar: 'https://minotar.net/helm/fisureti/64.webp' },
        { name: 'samurdok', role: 'Participante', avatar: 'https://minotar.net/helm/samurdok/64.webp' },
        { name: 'Miguel_Soap', role: 'Participante', avatar: 'https://minotar.net/helm/Miguel_Soap/64.webp' },
        { name: 'ElTormentoXD', role: 'Participante', avatar: 'https://minotar.net/helm/ElTormentoXD/64.webp' }
      ]
    },
    {
      id: 32,
      name: 'Tanda 32',
      image: 'images/grupo32.webp',
      revealed: false,
      revealDate: 'Tanda 32',
      members: [
        { name: 'Eideh', role: 'Participante', avatar: 'https://minotar.net/helm/Eideh/64.webp' },
        { name: 'TotoCapo398', role: 'Participante', avatar: 'https://minotar.net/helm/TotoCapo398/64.webp' },
        { name: 'Crssss_', role: 'Participante', avatar: 'https://minotar.net/helm/Crssss_/64.webp' },
        { name: 'Serevyn', role: 'Participante', avatar: 'https://minotar.net/helm/Serevyn/64.webp' },
        { name: 'alexics', role: 'Participante', avatar: 'https://minotar.net/helm/alexics/64.webp' }
      ]
    },
    {
      id: 33,
      name: 'Tanda 33',
      image: 'images/grupo33.webp',
      revealed: false,
      revealDate: 'Tanda 33',
      members: [
        { name: 'Jokih222', role: 'Participante', avatar: 'https://minotar.net/helm/Jokih222/64.webp' },
        { name: 'Asphyxxia', role: 'Participante', avatar: 'https://minotar.net/helm/Asphyxxia/64.webp' },
        { name: 'julioadts', role: 'Participante', avatar: 'https://minotar.net/helm/julioadts/64.webp' },
        { name: 'Zzant_07', role: 'Participante', avatar: 'https://minotar.net/helm/Zzant_07/64.webp' },
        { name: 'sthefano', role: 'Participante', avatar: 'https://minotar.net/helm/sthefano/64.webp' }
      ]
    },
    {
      id: 34,
      name: 'Tanda 34',
      image: 'images/grupo34.webp',
      revealed: false,
      revealDate: 'Tanda 34',
      members: [
        { name: 'ByAngelpa_', role: 'Participante', avatar: 'https://minotar.net/helm/ByAngelpa_/64.webp' },
        { name: 'Panmazahado', role: 'Participante', avatar: 'https://minotar.net/helm/Panmazahado/64.webp' },
        { name: 'FL_billiken1905', role: 'Participante', avatar: 'https://minotar.net/helm/FL_billiken1905/64.webp' },
        { name: 'ZapatonCachondo', role: 'Participante', avatar: 'https://minotar.net/helm/ZapatonCachondo/64.webp' },
        { name: 'BlessedDragox', role: 'Participante', avatar: 'https://minotar.net/helm/BlessedDragox/64.webp' }
      ]
    },
    {
      id: 35,
      name: 'Tanda 35',
      image: 'images/grupo35.webp',
      revealed: false,
      revealDate: 'Tanda 35',
      members: [
        { name: 'cirocasta_', role: 'Participante', avatar: 'https://minotar.net/helm/cirocasta_/64.webp' },
        { name: 'william47', role: 'Participante', avatar: 'https://minotar.net/helm/william47/64.webp' },
        { name: 'Nathalex_YT', role: 'Participante', avatar: 'https://minotar.net/helm/Nathalex_YT/64.webp' },
        { name: 'RebelAndrew', role: 'Participante', avatar: 'https://minotar.net/helm/RebelAndrew/64.webp' },
        { name: 'Polardss', role: 'Participante', avatar: 'https://minotar.net/helm/Polardss/64.webp' }
      ]
    },
    {
      id: 36,
      name: 'Tanda 36',
      image: 'images/grupo36.webp',
      revealed: false,
      revealDate: 'Tanda 36',
      members: [
        { name: 'Coppel', role: 'Participante', avatar: 'https://minotar.net/helm/Coppel/64.webp' },
        { name: 'HOOD21', role: 'Participante', avatar: 'https://minotar.net/helm/HOOD21/64.webp' },
        { name: 'RojitoGoes', role: 'Participante', avatar: 'https://minotar.net/helm/RojitoGoes/64.webp' },
        { name: 'TinybiteOF', role: 'Participante', avatar: 'https://minotar.net/helm/TinybiteOF/64.webp' },
        { name: 'MrDeam', role: 'Participante', avatar: 'https://minotar.net/helm/MrDeam/64.webp' }
      ]
    },
    {
      id: 37,
      name: 'Tanda 37',
      image: 'images/grupo37.webp',
      revealed: false,
      revealDate: 'Tanda 37',
      members: [
        { name: 'PachamancaUwu', role: 'Participante', avatar: 'https://minotar.net/helm/PachamancaUwu/64.webp' },
        { name: 'Laufwy', role: 'Participante', avatar: 'https://minotar.net/helm/Laufwy/64.webp' },
        { name: 'InkognitoMC', role: 'Participante', avatar: 'https://minotar.net/helm/InkognitoMC/64.webp' },
        { name: 'TitanioTi', role: 'Participante', avatar: 'https://minotar.net/helm/TitanioTi/64.webp' },
        { name: 'Jeicito', role: 'Participante', avatar: 'https://minotar.net/helm/Jeicito/64.webp' }
      ]
    }
  ]);

  ngOnInit() {
    this.configSub = this.revealConfig.getRevealTargetMs().subscribe(targetMs => {
      this.calculateReveals(targetMs);
    });
  }

  private calculateReveals(_originalTarget: number) {
    this.groups.update(currentGroups => {
      return currentGroups.map(group => ({ ...group, revealed: true }));
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
