import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ApiService,
  SuccessItem,
  UserClasses,
  UserProfile
} from '../../services/api.service';
import { normalizeProfilePictureUrl } from '../../shared/profile-display';

interface DofusClassOption {
  name: string;
  icon: string;
}

interface MonthOption {
  value: string;
  label: string;
}

const DOFUS_CLASSES: DofusClassOption[] = [
  'Panda', 'Iop', 'Zobal', 'Enu', 'Feca', 'Crâ', 'Sacri', 'Steam', 'Forge', 'Hupper',
  'Eca', 'Xel', 'Elio', 'Roub', 'Sram', 'Sadi', 'Eni', 'Ougi', 'Osa'
].map((name) => ({ name, icon: `/assets/class_icons/${name}.png` }));

const MONTHS: MonthOption[] = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
].map((label, index) => ({ label, value: String(index + 1).padStart(2, '0') }));

interface SuccessBadge {
  id: number;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css'
})
export class MyProfileComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private picturePreviewUrl: string | null = null;

  readonly classOptions = DOFUS_CLASSES;
  readonly selectedClass = signal<DofusClassOption | null>(null);
  readonly selectedSecondaryClasses = signal<DofusClassOption[]>([]);
  readonly isClassMenuOpen = signal<'main' | 'secondary' | null>(null);
  readonly isUpdatingClass = signal(false);
  readonly savedMainClass = signal('');
  readonly classStatus = signal('');
  readonly isMainClassChanged = computed(
    () => (this.selectedClass()?.name ?? '') !== this.savedMainClass()
  );

  readonly user = signal<UserProfile | null>(null);

  readonly profilePicture = signal<string | null>(null);
  readonly pendingPicture = signal<File | null>(null);
  readonly pendingPicturePreview = signal<string | null>(null);
  readonly isUpdatingPicture = signal(false);
  readonly pictureStatus = signal('');
  readonly displayedPicture = computed(
    () => this.pendingPicturePreview() ?? this.profilePicture()
  );

  readonly birthdayDay = signal('');
  readonly birthdayMonth = signal('');
  readonly birthdayWish = signal('');
  readonly savedBirthday = signal('');
  readonly savedBirthdayWish = signal('');
  readonly isUpdatingBirthday = signal(false);
  readonly birthdayStatus = signal('');
  readonly months = MONTHS;
  readonly availableDays = computed(() => {
    const month = Number(this.birthdayMonth());
    const daysInMonth = month ? new Date(2000, month, 0).getDate() : 31;
    return Array.from({ length: daysInMonth }, (_, index) =>
      String(index + 1).padStart(2, '0')
    );
  });
  readonly isBirthdayChanged = computed(
    () => this.serializedBirthday() !== this.savedBirthday()
      || this.birthdayWish() !== this.savedBirthdayWish()
  );

  readonly presentation = signal('');
  readonly savedPresentation = signal('');
  readonly presentationLoaded = signal(false);
  readonly isUpdatingPresentation = signal(false);
  readonly presentationStatus = signal('');
  readonly isPresentationChanged = computed(
    () => this.presentation() !== this.savedPresentation()
  );

  readonly successBadges = signal<SuccessBadge[]>([]);
  readonly successBadgesLoading = signal(true);
  readonly totalSuccesses = signal(0);
  readonly unlockedSuccessesCount = signal(0);
  readonly ticketCount = signal(0);
  readonly totalPossibleTickets = signal(0);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadUser(),
      this.loadProfilePicture(),
      this.loadBirthday(),
      this.loadPresentation(),
      this.loadClasses(),
      this.loadSuccessBadges(),
      this.loadSeason2Unlocks()
    ]);
  }

  ngOnDestroy(): void {
    this.revokePicturePreview();
  }

  iconPath(icon: string): string {
    return `/assets/succes_icons/${icon}`;
  }

  toggleClassMenu(menu: 'main' | 'secondary'): void {
    this.classStatus.set('');
    this.isClassMenuOpen.update((current) => (current === menu ? null : menu));
  }

  async selectClass(option: DofusClassOption, isSecondary = false): Promise<void> {
    if (this.isUpdatingClass()) {
      return;
    }

    this.classStatus.set('');
    if (!isSecondary) {
      this.selectedClass.set(option);
      this.isClassMenuOpen.set(null);
      return;
    }

    this.isUpdatingClass.set(true);
    try {
      const response = this.isSecondaryClassSelected(option)
        ? await this.apiService.removeUserSecondaryClass(option.name)
        : await this.apiService.addUserSecondaryClass(option.name);
      this.applyClasses(response);
      this.classStatus.set(response.message ?? 'Classes secondaires mises à jour.');
    } catch {
      this.classStatus.set('Impossible de mettre à jour les classes secondaires.');
    } finally {
      this.isUpdatingClass.set(false);
    }
  }

  async saveMainClass(): Promise<void> {
    const selected = this.selectedClass();
    if (!selected || !this.isMainClassChanged() || this.isUpdatingClass()) {
      return;
    }

    this.isUpdatingClass.set(true);
    this.classStatus.set('');
    try {
      const user = await this.apiService.updateUserClass(selected.name);
      this.user.set(user);
      this.selectedClass.set(this.findClassOption(user.class));
      this.savedMainClass.set(this.selectedClass()?.name ?? '');
      this.classStatus.set('Classe principale mise à jour.');
      try {
        this.applyClasses(await this.apiService.getUserClasses());
      } catch {
        this.selectedSecondaryClasses.update((classes) =>
          classes.filter((current) => current.name !== selected.name)
        );
      }
    } catch {
      this.classStatus.set('Impossible de mettre à jour la classe principale.');
    } finally {
      this.isUpdatingClass.set(false);
    }
  }

  isClassSelected(option: DofusClassOption): boolean {
    return this.selectedClass()?.name === option.name;
  }

  isSecondaryClassSelected(option: DofusClassOption): boolean {
    return this.selectedSecondaryClasses().some((current) => current.name === option.name);
  }

  onPictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    this.pictureStatus.set('');
    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.pictureStatus.set('Format non pris en charge. Choisissez une image PNG ou JPG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.pictureStatus.set("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    this.revokePicturePreview();
    this.picturePreviewUrl = URL.createObjectURL(file);
    this.pendingPicture.set(file);
    this.pendingPicturePreview.set(this.picturePreviewUrl);
  }

  cancelPictureSelection(): void {
    this.pendingPicture.set(null);
    this.pendingPicturePreview.set(null);
    this.pictureStatus.set('');
    this.revokePicturePreview();
  }

  async uploadPicture(): Promise<void> {
    const picture = this.pendingPicture();
    if (!picture || this.isUpdatingPicture()) {
      return;
    }

    this.isUpdatingPicture.set(true);
    this.pictureStatus.set('');
    try {
      const response = await this.apiService.updateProfilePicture(picture);
      this.profilePicture.set(normalizeProfilePictureUrl(response.picture_url));
      this.cancelPictureSelection();
      this.pictureStatus.set(response.message ?? 'Photo de profil mise à jour.');
    } catch {
      this.pictureStatus.set("Impossible d'envoyer la photo de profil.");
    } finally {
      this.isUpdatingPicture.set(false);
    }
  }

  async deletePicture(): Promise<void> {
    if (this.isUpdatingPicture()) {
      return;
    }

    this.isUpdatingPicture.set(true);
    this.pictureStatus.set('');
    try {
      const response = await this.apiService.deleteProfilePicture();
      this.profilePicture.set(null);
      this.cancelPictureSelection();
      this.pictureStatus.set(response.message ?? 'Photo de profil supprimée.');
    } catch {
      this.pictureStatus.set('Impossible de supprimer la photo de profil.');
    } finally {
      this.isUpdatingPicture.set(false);
    }
  }

  onBirthdayMonthChange(): void {
    if (this.birthdayDay() && !this.availableDays().includes(this.birthdayDay())) {
      this.birthdayDay.set('');
    }
    this.birthdayStatus.set('');
  }

  async saveBirthday(): Promise<void> {
    if (!this.isBirthdayChanged() || this.isUpdatingBirthday()) {
      return;
    }

    if ((this.birthdayDay() && !this.birthdayMonth()) || (!this.birthdayDay() && this.birthdayMonth())) {
      this.birthdayStatus.set('Sélectionnez le jour et le mois.');
      return;
    }

    this.isUpdatingBirthday.set(true);
    this.birthdayStatus.set('');
    try {
      const response = await this.apiService.updateUserBirthday(
        this.serializedBirthday() || null,
        this.birthdayWish().trim() || null
      );
      this.applyBirthday(response.birthday, response.wish);
      this.birthdayStatus.set(response.message ?? 'Anniversaire mis à jour.');
    } catch {
      this.birthdayStatus.set("Impossible de mettre à jour l'anniversaire.");
    } finally {
      this.isUpdatingBirthday.set(false);
    }
  }

  async savePresentation(): Promise<void> {
    if (!this.isPresentationChanged() || this.isUpdatingPresentation()) {
      return;
    }

    this.isUpdatingPresentation.set(true);
    this.presentationStatus.set('');
    try {
      const response = await this.apiService.updateUserPresentation(this.presentation().trim());
      const saved = response.presentation ?? '';
      this.presentation.set(saved);
      this.savedPresentation.set(saved);
      this.presentationStatus.set(response.message ?? 'Présentation mise à jour.');
    } catch {
      this.presentationStatus.set('Impossible de mettre à jour la présentation.');
    } finally {
      this.isUpdatingPresentation.set(false);
    }
  }

  private async loadUser(): Promise<void> {
    try {
      const user = await this.apiService.getUser();
      this.user.set(user);
      const selected = this.findClassOption(user.class);
      this.selectedClass.set(selected);
      this.savedMainClass.set(selected?.name ?? '');
    } catch {
      this.user.set(null);
    }
  }

  private async loadProfilePicture(): Promise<void> {
    try {
      const response = await this.apiService.getProfilePicture();
      this.profilePicture.set(normalizeProfilePictureUrl(response.picture_url));
    } catch {
      this.profilePicture.set(null);
      this.pictureStatus.set('Impossible de charger la photo de profil.');
    }
  }

  private async loadBirthday(): Promise<void> {
    try {
      const response = await this.apiService.getUserBirthday();
      this.applyBirthday(response.birthday, response.wish);
    } catch {
      this.birthdayStatus.set("Impossible de charger l'anniversaire.");
    }
  }

  private async loadPresentation(): Promise<void> {
    try {
      const response = await this.apiService.getUserPresentation();
      const value = response.presentation ?? '';
      this.presentation.set(value);
      this.savedPresentation.set(value);
    } catch {
      this.presentationStatus.set('Impossible de charger la présentation.');
    } finally {
      this.presentationLoaded.set(true);
    }
  }

  private async loadClasses(): Promise<void> {
    try {
      this.applyClasses(await this.apiService.getUserClasses());
    } catch {
      this.classStatus.set('Impossible de charger les classes secondaires.');
    }
  }

  private applyClasses(classes: UserClasses): void {
    const mainClass = this.findClassOption(classes.main_class);
    this.selectedClass.set(mainClass);
    this.savedMainClass.set(mainClass?.name ?? '');
    this.selectedSecondaryClasses.set(
      classes.secondary_classes
        .map((className) => this.findClassOption(className))
        .filter((option): option is DofusClassOption => option !== null)
        .filter((option) => option.name !== mainClass?.name)
    );
  }

  private applyBirthday(birthday: string | null, wish: string | null): void {
    const match = birthday?.match(/^\d{4}-(\d{2})-(\d{2})$/);
    this.birthdayMonth.set(match?.[1] ?? '');
    this.birthdayDay.set(match?.[2] ?? '');
    this.birthdayWish.set(wish ?? '');
    this.savedBirthday.set(this.serializedBirthday());
    this.savedBirthdayWish.set(wish ?? '');
  }

  private serializedBirthday(): string {
    if (!this.birthdayMonth() || !this.birthdayDay()) {
      return '';
    }

    // The API stores a DATE; 2000 preserves a recurring day/month and supports 29 February.
    return `2000-${this.birthdayMonth()}-${this.birthdayDay()}`;
  }

  private findClassOption(className: string | null | undefined): DofusClassOption | null {
    if (!className || className === 'undefined') {
      return null;
    }

    const normalizedClass = className === 'Cra' ? 'Crâ' : className;
    return this.classOptions.find((option) => option.name === normalizedClass) ?? null;
  }

  private async loadSuccessBadges(): Promise<void> {
    try {
      const [categories, unlocks] = await Promise.all([
        this.apiService.getSuccesses(),
        this.apiService.getUnlockedSuccesses()
      ]);
      const successes = categories.flatMap((category) => category.catList);
      this.totalSuccesses.set(successes.length);

      const badges = unlocks.unlockedList
        .map((unlocked) =>
          successes.find((success) => success.id === unlocked || success.name === unlocked)
        )
        .filter((success): success is SuccessItem => success !== undefined)
        .map(({ id, name, icon }) => ({ id, name, icon }));

      this.successBadges.set(badges);
      this.unlockedSuccessesCount.set(badges.length);
    } catch {
      this.successBadges.set([]);
      this.unlockedSuccessesCount.set(0);
    } finally {
      this.successBadgesLoading.set(false);
    }
  }

  private async loadSeason2Unlocks(): Promise<void> {
    const [unlocks, total] = await Promise.allSettled([
      this.apiService.getSeason2Unlocks(),
      this.apiService.getTotalPossibleTickets()
    ]);

    this.ticketCount.set(unlocks.status === 'fulfilled' ? unlocks.value.ticket_count || 0 : 0);
    if (total.status === 'fulfilled') {
      this.totalPossibleTickets.set(total.value.total || 0);
      return;
    }

    // Keep the page useful while the optional aggregate endpoint is being deployed.
    try {
      const successes = await this.apiService.getSeason2Successes();
      this.totalPossibleTickets.set(
        successes.reduce(
          (ticketTotal, success) => ticketTotal + (success.difficulte.match(/★/g) ?? []).length,
          0
        )
      );
    } catch {
      this.totalPossibleTickets.set(0);
    }
  }

  private revokePicturePreview(): void {
    if (this.picturePreviewUrl) {
      URL.revokeObjectURL(this.picturePreviewUrl);
      this.picturePreviewUrl = null;
    }
  }
}
