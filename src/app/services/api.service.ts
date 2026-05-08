import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

export interface SuccessItem {
  id: number;
  name: string;
  icon: string;
  desc: string;
  value: number;
  unlocked?: boolean;
}

export interface SuccessCategorySource {
  id: number;
  catName: string;
  icon: string;
  catValue?: number;
  CatValue?: number;
  catDesc?: string;
  CatDesc?: string;
  unlocked?: boolean;
  catList: SuccessItem[];
}

export interface SuccessUnlockResponse {
  unlockedList: Array<number | string>;
  totalPoints: number;
}

export interface SuccessClaimRequest {
  success: SuccessItem;
  description: string;
  images: File[];
}

export interface SuccessClaimResponse {
  ok: boolean;
  claimId?: string;
  message?: string;
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

export interface UserProfile {
  dofus_username: string;
  class: string;
}

export interface SuccessLeaderboardEntry {
  dofus_username: string;
  totalPoints: number;
  successCount: number;
  class?: string;
  className?: string;
  class_name?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getSuccesses(): Promise<SuccessCategorySource[]> {
    return firstValueFrom(this.http.get<SuccessCategorySource[]>(apiUrl('/api/succes')));
  }

  getUnlockedSuccesses(): Promise<SuccessUnlockResponse> {
    return firstValueFrom(this.http.get<SuccessUnlockResponse>(apiUrl('/api/succes/unlock')));
  }

  getSuccessLeaderboard(): Promise<SuccessLeaderboardEntry[]> {
    return firstValueFrom(
      this.http.get<SuccessLeaderboardEntry[]>(apiUrl('/api/succes/leaderboard'))
    );
  }

  submitSuccessClaim(request: SuccessClaimRequest): Promise<SuccessClaimResponse> {
    const formData = new FormData();

    formData.append('successId', String(request.success.id));
    formData.append('successName', request.success.name);
    formData.append('successDescription', request.success.desc);
    formData.append('description', request.description);

    for (const image of request.images) {
      formData.append('images', image, image.name);
    }

    return firstValueFrom(
      this.http.post<SuccessClaimResponse>(apiUrl('/api/succes/claim'), formData)
    );
  }

  getCalendarEvents(): Promise<NewsCalendarEvent[]> {
    return firstValueFrom(this.http.get<NewsCalendarEvent[]>(apiUrl('/api/news/calendar')));
  }

  getNewsletter(): Promise<NewsletterMessage> {
    return firstValueFrom(this.http.get<NewsletterMessage>(apiUrl('/api/news/letter')));
  }

  getUser(): Promise<UserProfile> {
    return firstValueFrom(this.http.get<UserProfile>(apiUrl('/api/user')));
  }

  updateUserClass(className: string): Promise<UserProfile> {
    return firstValueFrom(
      this.http.post<UserProfile>(apiUrl('/api/user/class'), { class: className })
    );
  }
}

function apiUrl(path: string): string {
  return `${environment.apiBaseUrl}${path}`;
}
