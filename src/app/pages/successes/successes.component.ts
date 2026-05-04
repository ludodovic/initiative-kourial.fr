import { Component, OnInit, inject, signal } from '@angular/core';

import { ApiService, SuccessUnlockResponse } from '../../services/api.service';

interface SuccessItem {
  id: number;
  name: string;
  icon: string;
  desc: string;
  value: number;
  unlocked?: boolean;
}

interface SuccessCategorySource {
  id: number;
  catName: string;
  icon: string;
  catValue?: number;
  CatValue?: number;
  catDesc?: string;
  CatDesc?: string;
  unlocked?: boolean;
  catList: SuccessItem[];
}

interface SuccessCategory {
  id: number;
  catName: string;
  icon: string;
  catValue: number;
  catDesc: string;
  unlocked: boolean;
  catList: SuccessItem[];
}

@Component({
  selector: 'app-successes',
  templateUrl: './successes.component.html',
  styleUrl: './successes.component.css'
})
export class SuccessesComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly categories = signal<SuccessCategory[]>([]);
  readonly collapsedCategories = signal<Set<number>>(new Set());
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly viewMode = signal<'compact' | 'large'>('large');
  readonly unlockedPoints = signal(0);
  readonly availablePoints = signal(780);

  async ngOnInit(): Promise<void> {
    try {
      const [response, unlocks] = await Promise.all([
        fetch('/succes_list.json'),
        this.loadUnlockedSuccesses()
      ]);

      if (!response.ok) {
        throw new Error(`Unable to load successes (${response.status})`);
      }

      const source = (await response.json()) as SuccessCategorySource[];
      const unlockedSuccesses = new Set(unlocks.unlockedList);

      this.unlockedPoints.set(unlocks.totalPoints);
      this.categories.set(
        source.map((category) => this.normalizeCategory(category, unlockedSuccesses))
      );
    } catch {
      this.error.set('Impossible de charger la liste des succes pour le moment.');
    } finally {
      this.isLoading.set(false);
    }
  }

  iconPath(icon: string): string {
    return `/assets/${icon}`;
  }

  setViewMode(mode: 'compact' | 'large'): void {
    this.viewMode.set(mode);
  }

  isCollapsed(categoryId: number): boolean {
    return this.collapsedCategories().has(categoryId);
  }

  toggleCategory(categoryId: number): void {
    this.collapsedCategories.update((collapsed) => {
      const next = new Set(collapsed);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  }

  private normalizeCategory(
    category: SuccessCategorySource,
    unlockedSuccesses: Set<number | string>
  ): SuccessCategory {
    const catList = category.catList.map((success) => ({
      ...success,
      unlocked: unlockedSuccesses.has(success.id) || unlockedSuccesses.has(success.name)
    }));

    return {
      id: category.id,
      catName: category.catName,
      icon: category.icon,
      catValue: category.catValue ?? category.CatValue ?? 0,
      catDesc: category.catDesc ?? category.CatDesc ?? '',
      unlocked:
        unlockedSuccesses.has(category.id) ||
        unlockedSuccesses.has(category.catName) ||
        catList.every((success) => success.unlocked),
      catList
    };
  }

  private async loadUnlockedSuccesses(): Promise<SuccessUnlockResponse> {
    try {
      return await this.apiService.getUnlockedSuccesses();
    } catch {
      return { unlockedList: [], totalPoints: 0 };
    }
  }
}
