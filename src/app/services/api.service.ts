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

export interface ProfilePictureResponse {
  picture_url: string | null;
  message?: string;
}

export interface UserBirthday {
  birthday: string | null;
  wish: string | null;
}

export interface UserBirthdayResponse extends UserBirthday {
  message?: string;
}

export interface UserPresentation {
  presentation: string | null;
}

export interface UserPresentationResponse extends UserPresentation {
  message?: string;
}

export interface UserClasses {
  main_class: string;
  secondary_classes: string[];
}

export interface UserClassesResponse extends UserClasses {
  message?: string;
}

export interface TotalTicketsResponse {
  total: number;
}

export interface PublicPlayerProfile {
  dofus_username: string;
  class: string;
  profile_picture_url: string | null;
  birthday: string | null;
  wish: string | null;
  presentation: string;
  secondary_classes: string[];
  roles: string[];
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

  getProfilePicture(): Promise<ProfilePictureResponse> {
    return firstValueFrom(
      this.http.get<ProfilePictureResponse>(apiUrl('/api/user/picture'))
    );
  }

  updateProfilePicture(picture: File): Promise<ProfilePictureResponse> {
    const formData = new FormData();
    formData.append('picture', picture, picture.name);

    return firstValueFrom(
      this.http.post<ProfilePictureResponse>(apiUrl('/api/user/picture'), formData)
    );
  }

  deleteProfilePicture(): Promise<ProfilePictureResponse> {
    return firstValueFrom(
      this.http.delete<ProfilePictureResponse>(apiUrl('/api/user/picture'))
    );
  }

  getUserBirthday(): Promise<UserBirthday> {
    return firstValueFrom(this.http.get<UserBirthday>(apiUrl('/api/user/birthday')));
  }

  updateUserBirthday(birthday: string | null, wish: string | null): Promise<UserBirthdayResponse> {
    return firstValueFrom(
      this.http.post<UserBirthdayResponse>(apiUrl('/api/user/birthday'), { birthday, wish })
    );
  }

  getUserPresentation(): Promise<UserPresentation> {
    return firstValueFrom(
      this.http.get<UserPresentation>(apiUrl('/api/user/presentation'))
    );
  }

  updateUserPresentation(presentation: string): Promise<UserPresentationResponse> {
    return firstValueFrom(
      this.http.post<UserPresentationResponse>(apiUrl('/api/user/presentation'), { presentation })
    );
  }

  getUserClasses(): Promise<UserClasses> {
    return firstValueFrom(this.http.get<UserClasses>(apiUrl('/api/user/classes')));
  }

  updateUserSecondaryClasses(secondaryClasses: string[]): Promise<UserClassesResponse> {
    return firstValueFrom(
      this.http.post<UserClassesResponse>(apiUrl('/api/user/classes'), {
        secondary_classes: secondaryClasses
      })
    );
  }

  addUserSecondaryClass(className: string): Promise<UserClassesResponse> {
    return firstValueFrom(
      this.http.post<UserClassesResponse>(apiUrl('/api/user/classes/add'), {
        class_name: className
      })
    );
  }

  removeUserSecondaryClass(className: string): Promise<UserClassesResponse> {
    return firstValueFrom(
      this.http.post<UserClassesResponse>(apiUrl('/api/user/classes/remove'), {
        class_name: className
      })
    );
  }

  getPublicProfiles(): Promise<PublicPlayerProfile[]> {
    return firstValueFrom(
      this.http.get<PublicPlayerProfile[]>(apiUrl('/api/profiles'))
    );
  }

  getPublicProfile(dofusUsername: string): Promise<PublicPlayerProfile> {
    return firstValueFrom(
      this.http.get<PublicPlayerProfile>(
        apiUrl(`/api/profiles/${encodeURIComponent(dofusUsername)}`)
      )
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
    
    return Array.from(dungeonMap.entries()).map(([donjon, imgs]) => ({
      name: donjon,
      imgs: [...new Set(imgs)]
    }));
  }

  getSeason2Unlocks(): Promise<Season2UnlockResponse> {
    return firstValueFrom(this.http.get<Season2UnlockResponse>(apiUrl('/api/succes/unlock')));
  }

  getTotalPossibleTickets(): Promise<TotalTicketsResponse> {
    return firstValueFrom(
      this.http.get<TotalTicketsResponse>(apiUrl('/api/succes2/total-tickets'))
    );
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
