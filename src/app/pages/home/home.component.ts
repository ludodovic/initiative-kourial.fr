import { Component, OnInit, inject, signal } from '@angular/core';

import { ApiService, NewsletterMessage, SuccessItem } from '../../services/api.service';

interface SuccessBadge {
  id: number;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly discordConnectionMessageUrl =
    'https://discord.com/channels/1501267746128662538/1522726643293098005/1523422547771916432';

  readonly guildDescription =
    'Initiative rassemble des aventuriers de Kourial qui aiment avancer ensemble : sorties donjons, missions de guilde, songes infinis et tout le tralala. Et bien sur, bonne humeur entre deux combats tendus.';

  readonly newsletter = signal<NewsletterMessage>({
    title: 'Infos pratiques',
    date: '',
    content: "Si vous n'êtes pas connecté, rendez-vous sur le channel #site-web-initiative sur notre serveur Discord. Vous y trouverez toutes les infos nécessaires."
  });
  readonly successBadges = signal<SuccessBadge[]>([]);
  readonly successBadgesLoading = signal(true);

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadSuccessBadges(), this.loadNewsletter()]);
  }

  iconPath(icon: string): string {
    return `/assets/succes_icons/${icon}`;
  }

  formatNewsletterDate(date: string): string {
    const parsedDate = parseIsoDate(date);

    if (!parsedDate) {
      return date;
    }

    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(parsedDate);
  }

  private async loadSuccessBadges(): Promise<void> {
    try {
      const [categories, unlocks] = await Promise.all([
        this.apiService.getSuccesses(),
        this.apiService.getUnlockedSuccesses()
      ]);
      const successes = categories.flatMap((category) => category.catList);
      const badges = unlocks.unlockedList
        .map((unlockedSuccess) =>
          successes.find((success) => success.id === unlockedSuccess || success.name === unlockedSuccess)
        )
        .filter((success): success is SuccessItem => success !== undefined)
        .map((success) => ({
          id: success.id,
          name: success.name,
          icon: success.icon
        }));

      this.successBadges.set(badges);
    } catch {
      this.successBadges.set([]);
    } finally {
      this.successBadgesLoading.set(false);
    }
  }

  private async loadNewsletter(): Promise<void> {
    try {
      this.newsletter.set(await this.apiService.getNewsletter());
    } catch {
      this.newsletter.set({
        title: 'Infos pratiques',
        date: '',
        content: "Si vous n'êtes pas connecté, rendez-vous sur le channel #site-web-initiative sur notre serveur Discord. Vous y trouverez toutes les infos nécessaires."
      });
    }
  }
}

function parseIsoDate(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
