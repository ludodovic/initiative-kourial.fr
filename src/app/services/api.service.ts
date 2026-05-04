import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface SuccessUnlockResponse {
  unlockedList: Array<number | string>;
  totalPoints: number;
}

export interface NewsCalendarEvent {
  date: string;
  title: string;
  description: string;
  time?: string;
}

export interface NewsletterMessage {
  date: string;
  title: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getUnlockedSuccesses(): Promise<SuccessUnlockResponse> {
    return firstValueFrom(this.http.get<SuccessUnlockResponse>('/api/succes/unlock'));
  }

  getCalendarEvents(): Promise<NewsCalendarEvent[]> {
    return firstValueFrom(this.http.get<NewsCalendarEvent[]>('/api/news/calendar'));
  }

  getNewsletter(): Promise<NewsletterMessage> {
    return firstValueFrom(this.http.get<NewsletterMessage>('/api/news/letter'));
  }
}
