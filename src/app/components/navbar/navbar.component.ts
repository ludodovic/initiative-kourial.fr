import { Component, DestroyRef, ElementRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { NAVBAR_ITEMS } from '../../config/navbar.config';
import { ApiService, CompanionDraftAccess, UserProfile } from '../../services/api.service';
import { AuthTokenService } from '../../services/auth-token.service';

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
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly guildName = 'Initiative';
  readonly items = NAVBAR_ITEMS;
  readonly user = signal<UserProfile | null>(null);
  readonly openNavMenu = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.closeNavMenu());

    if (!this.authTokenService.getToken()) {
      return;
    }

    try {
      this.user.set(await this.apiService.getUser());
    } catch {
      this.user.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.openNavMenu.set(null);
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target;
    const clickedInsideMenu = target instanceof Element
      && this.elementRef.nativeElement.contains(target)
      && target.closest('.navbar-menu') !== null;

    if (!clickedInsideMenu) {
      this.closeNavMenu();
    }
  }

  toggleNavMenu(name: string): void {
    this.openNavMenu.update((openName) => (openName === name ? null : name));
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

  classIconPath(className: string | null | undefined): string {
    const normalizedClass = className && className !== 'undefined'
      ? (className === 'Cra' ? 'Crâ' : className)
      : null;
    return `/assets/class_icons/${normalizedClass || 'NoClass'}.png`;
  }
}
