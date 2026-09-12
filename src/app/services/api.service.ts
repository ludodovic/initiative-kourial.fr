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

  getCompanionDraftAccess(): Promise<CompanionDraftAccess> {
    return firstValueFrom(this.http.get<CompanionDraftAccess>(apiUrl('/api/companion-drafts/access')));
  }

  getCompanionDraftUsers(): Promise<CompanionDraftUser[]> {
    return firstValueFrom(this.http.get<CompanionDraftUser[]>(apiUrl('/api/companion-drafts/roster')));
  }

  tossCompanionDraftCoin(id: string, version: number): Promise<CompanionDraftState> {
    return firstValueFrom(
      this.http.post<CompanionDraftState>(apiUrl(`/api/companion-drafts/${id}/coin-toss`), { version })
    );
  }

  resetCompanionDraft(id: string, version: number): Promise<CompanionDraftState> {
    return firstValueFrom(this.http.post<CompanionDraftState>(
      apiUrl(`/api/companion-drafts/${id}/reset`), { version }
    ));
  }

  performCompanionDraftAction(
    id: string,
    action: CompanionDraftActionType,
    request: CompanionDraftActionRequest
  ): Promise<CompanionDraftState> {
    return firstValueFrom(
      this.http.post<CompanionDraftState>(apiUrl(`/api/companion-drafts/${id}/${action}`), request)
    );
  }

  getCompanionTournaments(): Promise<CompanionTournamentState[]> {
    return firstValueFrom(this.http.get<CompanionTournamentState[]>(apiUrl('/api/companion-tournaments')));
  }

  createCompanionTournament(request: CreateCompanionTournamentRequest): Promise<CompanionTournamentState> {
    return firstValueFrom(this.http.post<CompanionTournamentState>(apiUrl('/api/companion-tournaments'), request));
  }

  registerCompanionTournamentParticipant(tournamentId: string, userId: number): Promise<CompanionTournamentState> {
    return firstValueFrom(this.http.post<CompanionTournamentState>(
      apiUrl(`/api/companion-tournaments/${tournamentId}/participants`), { userId }
    ));
  }

  removeCompanionTournamentParticipant(tournamentId: string, userId: number): Promise<CompanionTournamentState> {
    return firstValueFrom(this.http.delete<CompanionTournamentState>(
      apiUrl(`/api/companion-tournaments/${tournamentId}/participants/${userId}`)
    ));
  }

  lockCompanionTournamentRegistration(tournamentId: string): Promise<CompanionTournamentState> {
    return firstValueFrom(this.http.post<CompanionTournamentState>(
      apiUrl(`/api/companion-tournaments/${tournamentId}/lock-registration`), {}
    ));
  }

  addCompanionTournamentTeam(tournamentId: string, request: CompanionTournamentTeamRequest): Promise<CompanionTournamentState> {
    return firstValueFrom(this.http.post<CompanionTournamentState>(
      apiUrl(`/api/companion-tournaments/${tournamentId}/teams`), request
    ));
  }

  removeCompanionTournamentTeam(tournamentId: string, teamId: string): Promise<CompanionTournamentState> {
    return firstValueFrom(this.http.delete<CompanionTournamentState>(
      apiUrl(`/api/companion-tournaments/${tournamentId}/teams/${teamId}`)
    ));
  }

  generateCompanionTournamentBracket(tournamentId: string): Promise<CompanionTournamentState> {
    return firstValueFrom(this.http.post<CompanionTournamentState>(
      apiUrl(`/api/companion-tournaments/${tournamentId}/generate`), {}
    ));
  }

  resetCompanionTournament(tournamentId: string, version: number): Promise<CompanionTournamentState> {
    return firstValueFrom(this.http.post<CompanionTournamentState>(
      apiUrl(`/api/companion-tournaments/${tournamentId}/reset`), { version }
    ));
  }

  resetCompanionTournamentRegistration(tournamentId: string, version: number): Promise<CompanionTournamentState> {
    return firstValueFrom(this.http.post<CompanionTournamentState>(
      apiUrl(`/api/companion-tournaments/${tournamentId}/reset-registration`), { version }
    ));
  }

  recordCompanionTournamentWinner(
    tournamentId: string,
    matchId: string,
    winnerTeamId: string,
    version: number
  ): Promise<CompanionTournamentState> {
    return firstValueFrom(this.http.post<CompanionTournamentState>(
      apiUrl(`/api/companion-tournaments/${tournamentId}/matches/${matchId}/winner`),
      { winnerTeamId, version }
    ));
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
