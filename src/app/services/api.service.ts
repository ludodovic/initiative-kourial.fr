import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getSuccesses(): Promise<SuccessCategorySource[]> {
    return firstValueFrom(this.http.get<SuccessCategorySource[]>('/api/succes'));
  }

  getUnlockedSuccesses(): Promise<SuccessUnlockResponse> {
    return firstValueFrom(this.http.get<SuccessUnlockResponse>('/api/succes/unlock'));
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

    return firstValueFrom(this.http.post<SuccessClaimResponse>('/api/succes/claim', formData));
  }

  getCalendarEvents(): Promise<NewsCalendarEvent[]> {
    return firstValueFrom(this.http.get<NewsCalendarEvent[]>('/api/news/calendar'));
  }

  getNewsletter(): Promise<NewsletterMessage> {
    return firstValueFrom(this.http.get<NewsletterMessage>('/api/news/letter'));
  }
}
