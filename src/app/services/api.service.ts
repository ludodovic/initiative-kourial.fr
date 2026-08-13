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

export type SuccessValidationStatus = 'pending' | 'approved' | 'refused';

export interface SuccessValidationRequest {
  succes_id: number;
  succes_name: string;
  submitted_at: string;
  submited_at?: string;
  requester_discord_username: string;
  status: SuccessValidationStatus;
}

export interface SuccessValidationsResponse {
  pending: SuccessValidationRequest[];
  approved: SuccessValidationRequest[];
  refused: SuccessValidationRequest[];
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

export interface Season2Success {
  donjon: string;
  nom: string;
  description: string;
  difficulte: string;
  id: number;
  imgs: string[];
  minLevel: number;
}

export interface Season2UnlockResponse {
  unlockedList2: number[];
  ticket_count: number;
}

export interface Season2SuccessClaimRequest {
  successId: number;
  successName: string;
  successDescription: string;
  description: string;
  images?: File[];
}

export interface Season2SuccessClaimResponse {
  ok: boolean;
  claimId?: string;
  message?: string;
}

export interface Dungeon {
  name: string;
  imgs: string[];
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

  getSuccessValidations(): Promise<SuccessValidationsResponse> {
    return firstValueFrom(
      this.http.get<SuccessValidationsResponse>(apiUrl('/api/succes/validations'))
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

  getSeason2Successes(): Promise<Season2Success[]> {
    return firstValueFrom(this.http.get<Season2Success[]>(apiUrl('/api/succes2')));
  }

  async getDungeons(): Promise<Dungeon[]> {
    const successes = await this.getSeason2Successes();
    const dungeonMap = new Map<string, string[]>();
    
    for (const success of successes) {
      if (!dungeonMap.has(success.donjon)) {
        dungeonMap.set(success.donjon, []);
      }
      dungeonMap.get(success.donjon)!.push(...success.imgs);
    }
    
    return Array.from(dungeonMap.entries()).map(([name, imgs]) => ({
      name,
      imgs: [...new Set(imgs)]
    }));
  }

  getSeason2Unlocks(): Promise<Season2UnlockResponse> {
    return firstValueFrom(this.http.get<Season2UnlockResponse>(apiUrl('/api/succes/unlock')));
  }

  submitSeason2SuccessClaim(request: Season2SuccessClaimRequest): Promise<Season2SuccessClaimResponse> {
    const formData = new FormData();

    formData.append('successId', String(request.successId));
    formData.append('successName', request.successName);
    formData.append('successDescription', request.successDescription);
    formData.append('description', request.description);

    if (request.images) {
      for (const image of request.images) {
        formData.append('images', image, image.name);
      }
    }

    return firstValueFrom(
      this.http.post<Season2SuccessClaimResponse>(apiUrl('/api/succes/claim'), formData)
    );
  }
}

function apiUrl(path: string): string {
  return `${environment.apiBaseUrl}${path}`;
}
