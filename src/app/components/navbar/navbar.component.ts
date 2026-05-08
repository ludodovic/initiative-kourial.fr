import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NAVBAR_ITEMS } from '../../config/navbar.config';
import { ApiService, UserProfile } from '../../services/api.service';
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
].map((name) => ({ name, icon: `/assets/${name}.png` }));

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authTokenService = inject(AuthTokenService);

  readonly guildName = 'Initiative';
  readonly items = NAVBAR_ITEMS;
  readonly classOptions = DOFUS_CLASSES;
  readonly user = signal<UserProfile | null>(null);
  readonly selectedClass = signal<DofusClassOption | null>(null);
  readonly isClassMenuOpen = signal(false);
  readonly isUpdatingClass = signal(false);

  async ngOnInit(): Promise<void> {
    if (!this.authTokenService.getToken()) {
      return;
    }

    try {
      this.setUser(await this.apiService.getUser());
    } catch {
      this.user.set(null);
      this.selectedClass.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.isClassMenuOpen.set(false);
  }

  classIconPath(className: string): string {
    return `/assets/${className}.png`;
  }

  toggleClassMenu(): void {
    this.isClassMenuOpen.update((isOpen) => !isOpen);
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
