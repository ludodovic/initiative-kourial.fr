import { Component, OnInit, inject, signal } from '@angular/core';

import {
  ApiService,
  SuccessCategorySource,
  SuccessItem,
  SuccessUnlockResponse
} from '../../services/api.service';

interface SuccessCategory {
  id: number;
  catName: string;
  icon: string;
  catValue: number;
  catDesc: string;
  unlocked: boolean;
  catList: SuccessItem[];
}

interface ClaimImage {
  file: File;
  previewUrl: string;
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
  readonly availablePoints = signal(1000);
  readonly selectedSuccess = signal<SuccessItem | null>(null);
  readonly claimImages = signal<ClaimImage[]>([]);
  readonly claimDescription = signal('');
  readonly isConfirmingClaim = signal(false);
  readonly isSubmittingClaim = signal(false);
  readonly claimError = signal('');
  readonly claimSuccess = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const [source, unlocks] = await Promise.all([
        this.apiService.getSuccesses(),
        this.loadUnlockedSuccesses()
      ]);
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
    return `/assets/succes_icons/${icon}`;
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

  openClaimForm(success: SuccessItem): void {
    this.cleanupClaimImages();
    this.selectedSuccess.set(success);
    this.claimImages.set([]);
    this.claimDescription.set('');
    this.isConfirmingClaim.set(false);
    this.isSubmittingClaim.set(false);
    this.claimError.set('');
    this.claimSuccess.set('');
  }

  closeClaimForm(): void {
    this.cleanupClaimImages();
    this.selectedSuccess.set(null);
    this.claimImages.set([]);
    this.claimDescription.set('');
    this.isConfirmingClaim.set(false);
    this.isSubmittingClaim.set(false);
    this.claimError.set('');
    this.claimSuccess.set('');
  }

  onClaimDescriptionInput(event: Event): void {
    this.claimDescription.set((event.target as HTMLTextAreaElement).value);
  }

  onClaimFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.addClaimFiles(input.files);
    input.value = '';
  }

  onClaimPaste(event: ClipboardEvent): void {
    const files = event.clipboardData?.files;

    if (files?.length) {
      event.preventDefault();
      this.addClaimFiles(files);
    }
  }

  removeClaimImage(index: number): void {
    this.claimImages.update((images) => {
      const next = [...images];
      const [removed] = next.splice(index, 1);

      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      return next;
    });
    this.isConfirmingClaim.set(false);
  }

  requestClaimConfirmation(): void {
    if (!this.claimImages().length || this.isSubmittingClaim()) {
      return;
    }

    this.claimError.set('');
    this.isConfirmingClaim.set(true);
  }

  cancelClaimConfirmation(): void {
    this.isConfirmingClaim.set(false);
  }

  async submitClaim(): Promise<void> {
    const success = this.selectedSuccess();

    if (!success || !this.claimImages().length || this.isSubmittingClaim()) {
      return;
    }

    this.isSubmittingClaim.set(true);
    this.claimError.set('');

    try {
      const response = await this.apiService.submitSuccessClaim({
        success,
        description: this.claimDescription().trim(),
        images: this.claimImages().map((image) => image.file)
      });

      if (!response.ok) {
        throw new Error(response.message ?? 'Claim rejected');
      }

      this.claimSuccess.set('Demande envoyee.');
      this.isConfirmingClaim.set(false);
    } catch {
      this.claimError.set('Impossible d envoyer la demande pour le moment.');
    } finally {
      this.isSubmittingClaim.set(false);
    }
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

  private addClaimFiles(files: FileList | null | undefined): void {
    if (!files?.length) {
      return;
    }

    const images = Array.from(files).filter((file) => isSupportedImage(file));

    if (!images.length) {
      this.claimError.set('Seuls les fichiers PNG, JPG et JPEG sont acceptes.');
      return;
    }

    this.claimError.set('');
    this.isConfirmingClaim.set(false);
    this.claimImages.update((currentImages) => [
      ...currentImages,
      ...images.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }))
    ]);
  }

  private cleanupClaimImages(): void {
    for (const image of this.claimImages()) {
      URL.revokeObjectURL(image.previewUrl);
    }
  }
}

function isSupportedImage(file: File): boolean {
  return ['image/png', 'image/jpeg'].includes(file.type);
}
