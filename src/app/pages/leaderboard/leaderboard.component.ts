import { Component, OnInit, inject, signal } from '@angular/core';

import { ApiService, SuccessLeaderboardEntry } from '../../services/api.service';

interface LeaderboardRow extends SuccessLeaderboardEntry {
  className: string;
  classIcon: string;
}

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly rows = signal<LeaderboardRow[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const entries = await this.apiService.getSuccessLeaderboard();

      this.rows.set(entries.map((entry) => this.toLeaderboardRow(entry)));
    } catch {
      this.error.set('Impossible de charger le classement pour le moment.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onClassIconError(event: Event): void {
    const image = event.target as HTMLImageElement;

    if (!image.src.endsWith('/assets/NoClass.png')) {
      image.src = '/assets/NoClass.png';
    }
  }

  private toLeaderboardRow(entry: SuccessLeaderboardEntry): LeaderboardRow {
    const className = normalizeClassName(entry.class);

    return {
      ...entry,
      className,
      classIcon: `/assets/${className}.png`
    };
  }
}

function normalizeClassName(className: string | null | undefined): string {
  if (!className || className === 'undefined') {
    return 'NoClass';
  }

  return className === 'Cra' ? 'Crâ' : className;
}
