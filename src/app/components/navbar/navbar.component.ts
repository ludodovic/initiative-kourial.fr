import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { NAVBAR_ITEMS } from '../../config/navbar.config';
import { ApiService, CompanionDraftAccess, UserProfile } from '../../services/api.service';
import { AuthTokenService } from '../../services/auth-token.service';

interface DofusClassOption {
  name: string;
  icon: string;
}

const DOFUS_CLASSES: DofusClassOption[] = [
  'Panda',
  'Iop',
  'Zobal',
  'Enu',
  'Feca',
  'Crâ',
  'Sacri',
  'Steam',
  'Forge',
  'Hupper',
  'Eca',
  'Xel',
  'Elio',
  'Roub',
  'Sram',
  'Sadi',
  'Eni',
  'Ougi',
  'Osa'
].map((name) => ({ name, icon: `/assets/class_icons/${name}.png` }));

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authTokenService = inject(AuthTokenService);
  private readonly router = inject(Router);

  readonly guildName = 'Initiative';
  readonly items = NAVBAR_ITEMS;
  readonly classOptions = DOFUS_CLASSES;
  readonly user = signal<UserProfile | null>(null);
  readonly companionDraftAccess = signal<CompanionDraftAccess | null>(null);
  readonly selectedClass = signal<DofusClassOption | null>(null);
  readonly isClassMenuOpen = signal(false);
  readonly openNavMenu = signal<string | null>(null);
  readonly isUpdatingClass = signal(false);

  async ngOnInit(): Promise<void> {
    if (!this.authTokenService.getToken()) {
      return;
    }

    try {
      this.setUser(await this.apiService.getUser());
      this.companionDraftAccess.set(await this.apiService.getCompanionDraftAccess());
    } catch {
      this.user.set(null);
      this.selectedClass.set(null);
      this.companionDraftAccess.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.isClassMenuOpen.set(false);
    this.openNavMenu.set(null);
  }

  classIconPath(className: string): string {
    return `/assets/class_icons/${className}.png`;
  }

  toggleClassMenu(): void {
    this.isClassMenuOpen.update((isOpen) => !isOpen);
    this.openNavMenu.set(null);
  }

  toggleNavMenu(name: string): void {
    this.openNavMenu.update((openName) => (openName === name ? null : name));
    this.isClassMenuOpen.set(false);
  }

  closeNavMenu(): void {
    this.openNavMenu.set(null);
  }

  isNavGroupActive(links: string[]): boolean {
    return links.some((link) => this.router.isActive(link, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    }));
  }

  canShowItem(adminOnly: boolean | undefined, draftAccess = false): boolean {
    if (draftAccess) {
      return this.companionDraftAccess()?.canAccessPage === true;
    }
    return !adminOnly || this.companionDraftAccess()?.isAdmin === true;
  }

  async selectClass(option: DofusClassOption): Promise<void> {
    if (this.isUpdatingClass()) {
      return;
    }

    this.isUpdatingClass.set(true);

    try {
      this.setUser(await this.apiService.updateUserClass(option.name));
      this.isClassMenuOpen.set(false);
    } catch {
      this.isClassMenuOpen.set(false);
    } finally {
      this.isUpdatingClass.set(false);
    }
  }

  async logout(): Promise<void> {
    this.authTokenService.clearToken();
    this.user.set(null);
    this.selectedClass.set(null);
    this.companionDraftAccess.set(null);
    this.isClassMenuOpen.set(false);
    await this.router.navigateByUrl('/');
  }

  private setUser(user: UserProfile): void {
    this.user.set(user);
    this.selectedClass.set(this.findClassOption(user.class));
  }

  private findClassOption(className: string | null | undefined): DofusClassOption | null {
    if (!className || className === 'undefined') {
      return null;
    }

    const normalizedClass = className === 'Cra' ? 'Crâ' : className;

    return this.classOptions.find((option) => option.name === normalizedClass) ?? null;
  }
}
