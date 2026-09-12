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

export interface CompanionDraftAccess {
  isAdmin: boolean;
  activeDraftId: string | null;
  activeTournamentId: string | null;
  canAccessPage: boolean;
}

export interface CompanionDraftUser {
  id: number;
  dofus_username: string;
  class?: string;
}

export interface CompanionDraftTeam {
  id: string;
  tournamentTeamId?: string;
  name: string;
  users: CompanionDraftUser[];
}

export type CompanionDraftCardStatus = 'available' | 'banned' | 'picked';
export type CompanionDraftActionType = 'ban' | 'pick';

export interface CompanionDraftCompanion {
  id: number;
  name: string;
  image?: string;
  status: CompanionDraftCardStatus;
  teamId?: string;
}

export interface CompanionDraftAction {
  sequence: number;
  type: CompanionDraftActionType;
  teamId: string;
  companionId: number;
}

export interface CompanionDraftState {
  id: string;
  status: string;
  phase: CompanionDraftActionType | 'coin_toss' | 'complete';
  version: number;
  currentTeam: string | null;
  teams: CompanionDraftTeam[];
  companions: CompanionDraftCompanion[];
  actions: CompanionDraftAction[];
  currentTurnLabel: string;
  coinToss: string | null;
  canCoinToss: boolean;
  canAct: boolean;
}

export type CompanionTournamentFormat = 'single_match' | 'single_elimination';
export type CompanionTournamentTeamSize = 2;

export interface CompanionTournamentTeam {
  teamId: string;
  name: string;
  participantIds: number[];
  participants: CompanionDraftUser[];
}

export interface CompanionTournamentMatch {
  matchId: string;
  round: number;
  position: number;
  teamIds: Array<string | null>;
  resultStatus: 'pending' | 'ready' | 'bye' | 'complete';
  winnerTeamId: string | null;
  draftId: string | null;
  draft?: CompanionDraftState;
}

export interface CompanionTournamentRound {
  number: number;
  matches: CompanionTournamentMatch[];
}

export interface CompanionTournamentState {
  id: string;
  name: string;
  format: CompanionTournamentFormat;
  teamSize: CompanionTournamentTeamSize;
  status: 'registration' | 'team_building' | 'active' | 'complete';
  version: number;
  teams: CompanionTournamentTeam[];
  participants: CompanionDraftUser[];
  registeredParticipants: CompanionDraftUser[];
  rounds: CompanionTournamentRound[];
}

export interface CreateCompanionTournamentRequest {
  name: string;
  format: CompanionTournamentFormat;
  teamSize: CompanionTournamentTeamSize;
}

export interface CompanionTournamentTeamRequest {
  name: string;
  participantIds: number[];
}

export interface CompanionDraftActionRequest {
  companionId: number;
  version: number;
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
