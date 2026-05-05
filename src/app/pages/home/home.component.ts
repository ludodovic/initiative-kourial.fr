import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ApiService, NewsCalendarEvent, NewsletterMessage } from '../../services/api.service';

interface GuildEvent {
  day: number;
  date: string;
  title: string;
  time?: string;
  description: string;
}

interface CalendarDay {
  day?: number;
  event?: GuildEvent;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly calendarDate = new Date(2026, 4, 1);

  readonly guildDescription =
    'Initiative rassemble des aventuriers de Kourial qui aiment avancer ensemble : sorties donjons, missions de guilde, songes infinis et tout le tralala. Et bien sûr, bonne humeur entre deux combats tendus.';

  readonly newsletter = signal<NewsletterMessage>({
    title: 'Actualites de guilde',
    date: '',
    content: 'Aucune newsletter disponible pour le moment.'
  });

  readonly events = signal<GuildEvent[]>([]);
  readonly calendarTitle = computed(() =>
    new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(this.calendarDate)
  );
  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: firstDayOffset }, () => ({})),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;

        return {
          day,
          event: this.events().find((event) => event.day === day)
        };
      })
    ];
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadCalendarEvents(), this.loadNewsletter()]);
  }

  formatNewsletterDate(date: string): string {
    const parsedDate = parseIsoDate(date);

    if (!parsedDate) {
      return date;
    }

    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(parsedDate);
  }

  private async loadCalendarEvents(): Promise<void> {
    try {
      const events = await this.apiService.getCalendarEvents();

      this.events.set(events.map((event) => this.toGuildEvent(event)).filter((event) => event !== null));
    } catch {
      this.events.set([]);
    }
  }

  private async loadNewsletter(): Promise<void> {
    try {
      this.newsletter.set(await this.apiService.getNewsletter());
    } catch {
      this.newsletter.set({
        title: 'Actualites de guilde',
        date: '',
        content: 'Aucune newsletter disponible pour le moment.'
      });
    }
  }

  private toGuildEvent(event: NewsCalendarEvent): GuildEvent | null {
    const parsedDate = parseIsoDate(event.date);

    if (!parsedDate || !isSameMonth(parsedDate, this.calendarDate)) {
      return null;
    }

    return {
      day: parsedDate.getDate(),
      date: event.date,
      title: event.title,
      time: event.time,
      description: event.description
    };
  }
}

function parseIsoDate(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function isSameMonth(date: Date, month: Date): boolean {
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}
