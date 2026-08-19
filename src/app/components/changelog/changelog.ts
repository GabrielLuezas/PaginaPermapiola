import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

/* ─── Data types ───────────────────────────────────────────── */

export interface Mechanic {
  tag: 'NUEVO' | 'AJUSTE' | 'FIX' | 'QUITADO';
  text: string;
}

export interface DungeonEntry {
  name: string;
  img: string;
  description: string;
}

export interface MobEntry {
  name: string;
  img: string;
  hearts?: number;
  equipment?: string[];
  description?: string;
  drop?: string;
}

export interface ItemEntry {
  name: string;
  img: string;
  description: string;
  droppedBy?: string;
  craftIngredients?: string;
}

export interface EffectEntry {
  name: string;
  img: string;
  description: string;
}

export interface RecipeSlot {
  row: number;
  col: number;
  name: string;
  count?: number;
  img?: string;
  tooltip?: string;
}

export interface RecipeEntry {
  title: string;
  type?: 'crafting' | 'furnace' | 'gui-showcase';
  gridCols?: number;
  gridRows?: number;
  slots?: RecipeSlot[];
  input?: RecipeSlot;
  fuel?: RecipeSlot;
  result?: RecipeSlot;
  description?: string;
}

export interface AmuletSystemData {
  title: string;
  command: string;
  description: string;
  gridCols?: number;
  gridRows?: number;
  slots?: RecipeSlot[];
  availableAmulets?: ItemEntry[];
}

export interface NpcReward {
  rank: string;
  amount: string;
  icon?: string;
  badgeClass?: string;
}

export interface NpcShopItem {
  name: string;
  img: string;
  description: string;
  category?: string;
  price?: string;
}

export interface NpcEntry {
  name: string;
  img?: string;
  description: string;
  cooldown?: string;
  rewards?: NpcReward[];
  guiTitle?: string;
  guiGridRows?: number;
  guiGridCols?: number;
  guiSlots?: RecipeSlot[];
  shopItems?: NpcShopItem[];
}

export interface GuideStep {
  title: string;
  text: string;
  img?: string;
  importantNote?: string;
}

export interface DungeonGuide {
  title: string;
  subtitle: string;
  mainImg?: string;
  rulesTitle?: string;
  rules?: string[];
  steps: GuideStep[];
}

export interface LootItem {
  name: string;
  chance: string;
  img: string;
}

export interface DungeonLootTable {
  title: string;
  subtitle: string;
  items: LootItem[];
}

export interface AmuletEntry {
  name: string;
  description: string;
  img: string;
}

export interface NewAmuletCategories {
  craftable: AmuletEntry[];
  normalVault: AmuletEntry[];
  ominousVault: AmuletEntry[];
  special: AmuletEntry[];
}

export interface DungeonDropItem {
  name: string;
  id: string;
  mcItem: string;
  img: string;
}

export interface DungeonDropsData {
  note: string;
  items: DungeonDropItem[];
}

export interface BossRole {
  name: string;
  color?: string;
  badge?: string;
  img?: string;
  description: string;
}

export interface BossAttack {
  name: string;
  badge?: string;
  img?: string;
  description: string;
}

export interface BossInfo {
  name: string;
  subtitle?: string;
  img?: string;
  hearts?: number;
  description?: string;
  attacks: BossAttack[];
}

export interface SpecialPhase {
  title: string;
  subtitle?: string;
  badge?: string;
  img?: string;
  description: string;
  rules?: string[];
}

export interface BossPhasesInfo {
  title?: string;
  subtitle?: string;
  rules: string[];
}

export interface Patch {
  number: number;
  day: number;
  revealDate?: string;
  locked: boolean;
  mechanics: Mechanic[];
  dungeons?: DungeonEntry[];
  effects?: EffectEntry[];
  raidsLevelUp?: MobEntry[];
  mobs: MobEntry[];
  crafts?: ItemEntry[];
  loot?: ItemEntry[];
  recipes?: RecipeEntry[];
  amuletSystem?: AmuletSystemData;
  npcs?: NpcEntry[];
  items?: ItemEntry[];
  dungeonGuide?: DungeonGuide;
  bossRoles?: BossRole[];
  bosses?: BossInfo[];
  bossPhases?: BossPhasesInfo;
  specialPhase?: SpecialPhase;
  dungeonLoot?: DungeonLootTable[];
  newAmuletCategories?: NewAmuletCategories;
  dungeonDrops?: DungeonDropsData;
}

/* ─── Component ─────────────────────────────────────────────── */

@Component({
  selector: 'app-changelog',
  imports: [CommonModule],
  templateUrl: './changelog.html',
  styleUrl: './changelog.css'
})
export class Changelog implements OnInit {
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  protected getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  protected formatMcText(text: string): string {
    if (!text) return '';
    if (!text.includes('§')) {
      return text.replace(/\n/g, '<br>');
    }
    
    const parts = text.split('§');
    let html = parts[0];
    let openSpansCount = 0;
    
    const colorMap: { [key: string]: string } = {
      '0': '#000000',
      '1': '#0000aa',
      '2': '#00aa00',
      '3': '#00aaaa',
      '4': '#aa0000',
      '5': '#aa00aa',
      '6': '#ffaa00',
      '7': '#aaaaaa',
      '8': '#555555',
      '9': '#5555ff',
      'a': '#55ff55',
      'b': '#55ffff',
      'c': '#ff5555',
      'd': '#ff55ff',
      'e': '#ffff55',
      'f': '#ffffff'
    };

    const styleMap: { [key: string]: string } = {
      'l': 'font-weight: bold;',
      'm': 'text-decoration: line-through;',
      'n': 'text-decoration: underline;',
      'o': 'font-style: italic;'
    };

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.length === 0) continue;
      const code = part[0].toLowerCase();
      const content = part.substring(1);
      
      if (code === 'r') {
        while (openSpansCount > 0) {
          html += '</span>';
          openSpansCount--;
        }
        html += content;
      } else if (colorMap[code]) {
        while (openSpansCount > 0) {
          html += '</span>';
          openSpansCount--;
        }
        html += `<span style="color: ${colorMap[code]};">`;
        openSpansCount++;
        html += content;
      } else if (styleMap[code]) {
        html += `<span style="${styleMap[code]}">`;
        openSpansCount++;
        html += content;
      } else {
        html += '§' + part;
      }
    }
    
    while (openSpansCount > 0) {
      html += '</span>';
      openSpansCount--;
    }
    
    return html.replace(/\n/g, '<br>');
  }

  protected readonly selectedPatch = signal<number>(1);
  protected readonly patches = signal<Patch[]>([]);
  protected readonly userRank = signal<string>('normal');
  protected readonly selectedZoomImage = signal<string | null>(null);

  protected readonly currentPatch = computed(() => {
    const list = this.patches();
    if (list.length === 0) {
      return {
        number: 1,
        day: 3,
        locked: true,
        mechanics: [],
        mobs: [],
        items: []
      };
    }
    return list.find(p => p.number === this.selectedPatch()) ?? list[0];
  });

  ngOnInit() {
    this.loadPatches();
  }

  protected loadPatches() {
    const token = this.authService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/changelogs', { headers })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar parches');
        return res.json();
      })
      .then(data => {
        this.patches.set(data.patches);
        this.userRank.set(data.userRank);
      })
      .catch(err => {
        console.error('Error loading changelogs:', err);
      });
  }

  protected selectPatch(n: number) {
    if (!this.patchLocked(n)) this.selectedPatch.set(n);
  }

  protected openZoom(img: string) {
    this.selectedZoomImage.set(img);
  }

  protected closeZoom() {
    this.selectedZoomImage.set(null);
  }

  protected patchLocked(n: number): boolean {
    const patch = this.patches().find(p => p.number === n);
    return patch ? patch.locked : true;
  }

  protected tagClass(tag: string): string {
    const map: Record<string, string> = {
      'NUEVO': 'tag-new',
      'NERFEO/BUFEO': 'tag-adj',
      'AJUSTE': 'tag-adj',
      'FIX': 'tag-fix',
      'REMOVIDO': 'tag-rm',
      'QUITADO': 'tag-rm'
    };
    return map[tag] ?? 'tag-adj';
  }

  protected heartArray(n: number): number[] {
    return Array(Math.min(n, 10)).fill(0);
  }

  protected rowArray(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  protected colArray(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  protected getSlot(recipe: RecipeEntry, row: number, col: number): RecipeSlot | undefined {
    return recipe.slots?.find(s => s.row === row && s.col === col);
  }

  protected getAmuletSlot(system: AmuletSystemData, row: number, col: number): RecipeSlot | undefined {
    return system.slots?.find(s => s.row === row && s.col === col);
  }

  protected getNpcSlot(npc: NpcEntry, row: number, col: number): RecipeSlot | undefined {
    return npc.guiSlots?.find(s => s.row === row && s.col === col);
  }
}
