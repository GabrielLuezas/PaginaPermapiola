import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
