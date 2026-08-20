import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Season2Success, Season2UnlockResponse, Season2SuccessClaimRequest, Season2SuccessClaimResponse } from '../../services/api.service';

interface SuccessCategory {
  id: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  successes: Season2SuccessWithState[];
}

interface Season2SuccessWithState extends Season2Success {
  unlocked: boolean;
}

@Component({
  selector: 'app-success-season-2',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './success-season-2.component.html',
  styleUrl: './success-season-2.component.css'
})
export class SuccessSeason2Component implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly allSuccesses = signal<Season2Success[]>([]);
  readonly unlockedSuccessIds = signal<number[]>([]);
  readonly ticketCount = signal<number>(0);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  // Filtres et recherche
  readonly searchQuery = signal('');
  readonly selectedDifficulty = signal<string | null>(null);
  readonly selectedCategory = signal<number | null>(null);
  readonly viewMode = signal<'large' | 'compact'>('large');

  // Modal de validation
  readonly selectedSuccess = signal<Season2SuccessWithState | null>(null);
  readonly claimImages = signal<{ file: File; previewUrl: string }[]>([]);
  readonly claimDescription = signal('');
  readonly isConfirmingClaim = signal(false);
  readonly isSubmittingClaim = signal(false);
  readonly claimError = signal('');
  readonly claimSuccess = signal('');



  // Catégories basées sur minLevel
  readonly categories = computed<SuccessCategory[]>(() => {
    const successes = this.allSuccesses();
    const unlockedIds = this.unlockedSuccessIds();

    const levelRanges = [
      { id: 1, name: 'Niveau 0-50', minLevel: 0, maxLevel: 50 },
      { id: 2, name: 'Niveau 51-100', minLevel: 51, maxLevel: 100 },
      { id: 3, name: 'Niveau 101-150', minLevel: 101, maxLevel: 150 },
      { id: 4, name: 'Niveau 151-200', minLevel: 151, maxLevel: 200 }
    ];

    return levelRanges.map(range => ({
      ...range,
      successes: successes
        .filter(s => s.minLevel >= range.minLevel && s.minLevel <= range.maxLevel)
        .map(s => ({
          ...s,
          unlocked: unlockedIds.includes(s.id)
        }))
    }));
  });

  // Succès filtrés
  readonly filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const difficulty = this.selectedDifficulty();
    const categoryId = this.selectedCategory();
    const categories = this.categories();

    return categories.map(category => {
      let filteredSuccesses = category.successes;

      // Filtre par nom
      if (query) {
        filteredSuccesses = filteredSuccesses.filter(s =>
          s.nom.toLowerCase().includes(query) ||
          s.donjon.toLowerCase().includes(query)
        );
      }

      // Filtre par difficulté
      if (difficulty) {
        filteredSuccesses = filteredSuccesses.filter(s => s.difficulte === difficulty);
      }

      // Filtre par catégorie
      if (categoryId !== null && categoryId !== category.id) {
        filteredSuccesses = [];
      }

      return {
        ...category,
        successes: filteredSuccesses
      };
    }).filter(c => c.successes.length > 0);
  });

  // Difficultés disponibles pour le filtre
  readonly availableDifficulties = computed(() => {
    const difficulties = new Set<string>();
    for (const category of this.categories()) {
      for (const success of category.successes) {
        difficulties.add(success.difficulte);
      }
    }
    return Array.from(difficulties).sort();
  });

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([this.loadSuccesses(), this.loadUnlocks()]);
    } catch {
      this.error.set('Impossible de charger les succès saison 2 pour le moment.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadSuccesses(): Promise<void> {
    this.allSuccesses.set(await this.apiService.getSeason2Successes());
  }

  async loadUnlocks(): Promise<void> {
    const unlocks = await this.apiService.getSeason2Unlocks();
    this.unlockedSuccessIds.set(unlocks.unlockedList2 || []);
    this.ticketCount.set(unlocks.ticket_count || 0);
  }

  setViewMode(mode: 'large' | 'compact'): void {
    this.viewMode.set(mode);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setDifficultyFilter(difficulty: string | null): void {
    this.selectedDifficulty.set(difficulty);
  }

  setCategoryFilter(categoryId: number | null): void {
    this.selectedCategory.set(categoryId);
  }

  // Modal de validation
  openClaimForm(success: Season2SuccessWithState): void {
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
    this.claimImages.update(images => {
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
    if (!this.claimImages().length) {
      // Les images ne sont pas obligatoires, on peut valider sans
      this.claimError.set('');
      this.isConfirmingClaim.set(true);
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
    if (!success || this.isSubmittingClaim()) {
      return;
    }

    // Validation côté client
    if (!success.description) {
      this.claimError.set('Les informations du succès sont incomplètes. Veuillez actualiser la page.');
      return;
    }

    this.isSubmittingClaim.set(true);
    this.claimError.set('');

    try {
      const request: Season2SuccessClaimRequest = {
        successId: success.id,
        successName: success.nom,
        successDescription: success.description,
        description: this.claimDescription().trim(),
        images: this.claimImages().map(img => img.file)
      };

      const response = await this.apiService.submitSeason2SuccessClaim(request);

      if (!response.ok) {
        throw new Error(response.message ?? 'Demande rejetée');
      }

      this.claimSuccess.set('Demande envoyée.');
      this.isConfirmingClaim.set(false);
      this.loadUnlocks(); // Recharger pour mettre à jour les succès déverrouillés
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Gestion des messages d'erreur plus spécifiques
      if (errorMessage.includes('successDescription') || errorMessage.includes('Field required')) {
        this.claimError.set('La description du succès est manquante. Veuillez réessayer.');
      } else if (errorMessage.includes('description')) {
        this.claimError.set('Veuillez fournir une description pour votre demande.');
      } else {
        this.claimError.set('Impossible d\'envoyer la demande pour le moment.');
      }
    } finally {
      this.isSubmittingClaim.set(false);
    }
  }

  // Helper pour les images
  private addClaimFiles(files: FileList | null | undefined): void {
    if (!files?.length) {
      return;
    }

    const images = Array.from(files).filter(file => this.isSupportedImage(file));
    if (!images.length) {
      this.claimError.set('Seuls les fichiers PNG, JPG et JPEG sont acceptés.');
      return;
    }

    this.claimError.set('');
    this.isConfirmingClaim.set(false);
    this.claimImages.update(currentImages => [
      ...currentImages,
      ...images.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }))
    ]);
  }

  private isSupportedImage(file: File): boolean {
    return ['image/png', 'image/jpeg'].includes(file.type);
  }

  private cleanupClaimImages(): void {
    for (const image of this.claimImages()) {
      URL.revokeObjectURL(image.previewUrl);
    }
  }

  // Helper pour les niveaux
  getLevelRangeLabel(minLevel: number, maxLevel: number): string {
    return `Niveau ${minLevel}-${maxLevel}`;
  }

  getTotalPossibleTickets(): number {
    // Calculer le total de tickets possibles basé sur la difficulté
    // Supposons que chaque étoile = 1 ticket, donc ★=1, ★★=2, etc.
    let total = 0;
    for (const category of this.categories()) {
      for (const success of category.successes) {
        const stars = (success.difficulte.match(/★/g) || []).length;
        total += stars;
      }
    }
    return total;
  }

  // Falling tickets animation data
  getFallingTickets(): {pos: string; delay: string}[] {
    const count = this.ticketCount();
    if (count <= 0) return [];
    
    return Array.from({length: Math.min(count, 20)}, (_, i) => {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      const distance = Math.random() * 30 + 10;
      const delay = (Math.random() * 2).toFixed(1);
      return {
        pos: side === 'left' ? distance + '%' : 'calc(100% - ' + distance + '%)',
        delay: delay + 's'
      };
    });
  }
}
