import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NgClass } from '@angular/common';

import {
  ApiService, CompanionDraftAccess, CompanionDraftActionType, CompanionDraftCompanion,
  CompanionDraftState, CompanionDraftUser, CompanionTournamentFormat,
  CompanionTournamentMatch, CompanionTournamentState,
} from '../../services/api.service';

@Component({
  selector: 'app-companion-draft',
  imports: [NgClass],
  templateUrl: './companion-draft.component.html',
  styleUrl: './companion-draft.component.css'
})
export class CompanionDraftComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private isRefreshing = false;
  private stateEpoch = 0;

  readonly access = signal<CompanionDraftAccess | null>(null);
  readonly tournaments = signal<CompanionTournamentState[]>([]);
  readonly selectedTournamentId = signal<string | null>(null);
  readonly users = signal<CompanionDraftUser[]>([]);
  readonly format = signal<CompanionTournamentFormat>('single_match');
  readonly tournamentName = signal('');
  readonly teamName = signal('');
  readonly teamParticipantIds = signal<number[]>([]);
  readonly userSearch = signal('');
  readonly companionSearch = signal('');
  readonly failedImages = signal<Set<number>>(new Set());
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly selectedTournament = computed(() => this.tournaments().find((item) => item.id === this.selectedTournamentId()) ?? null);
  readonly currentMatch = computed(() => this.findCurrentMatch(this.selectedTournament()));
  readonly activeDraft = computed(() => this.currentMatch()?.draft ?? null);
  readonly isDraftInProgress = computed(() => {
    const draft = this.activeDraft();
    return this.selectedTournament()?.status === 'active' && draft?.phase !== 'complete';
  });
  readonly isAdmin = computed(() => this.access()?.isAdmin === true);
  readonly unregisteredUsers = computed(() => {
    const registered = new Set(this.selectedTournament()?.registeredParticipants.map((user) => user.id) ?? []);
    return this.users().filter((user) => !registered.has(user.id) && this.matchesSearch(user, this.userSearch()));
  });
  readonly availableTeamUsers = computed(() => {
    const tournament = this.selectedTournament();
    if (!tournament) return [];
    const assigned = new Set(tournament.teams.flatMap((team) => team.participantIds));
    return tournament.registeredParticipants.filter((user) => !assigned.has(user.id) && this.matchesSearch(user, this.userSearch()));
  });
  readonly selectedTeamUsers = computed(() => {
    const selectedIds = new Set(this.teamParticipantIds());
    return this.selectedTournament()?.registeredParticipants.filter((user) => selectedIds.has(user.id)) ?? [];
  });
  readonly emptyTeamSlots = computed(() => Array.from({
    length: Math.max(0, (this.selectedTournament()?.teamSize ?? 0) - this.selectedTeamUsers().length),
  }));
  readonly remainingTeamUsers = computed(() => this.availableTeamUsers().filter((user) => !this.isTeamParticipant(user.id)));
  readonly canGenerateBracket = computed(() => {
    const tournament = this.selectedTournament();
    if (!tournament) return false;
    return tournament.teams.length >= (tournament.format === 'single_match' ? 2 : 4)
      && tournament.teams.length * tournament.teamSize === tournament.registeredParticipants.length;
  });
  readonly visibleCompanions = computed(() => this.activeDraft()?.companions.filter(
    (companion) => this.normalize(companion.name).includes(this.normalize(this.companionSearch()))
  ) ?? []);
  readonly canSaveTeam = computed(() => this.teamName().trim().length > 0 && this.teamParticipantIds().length === this.selectedTournament()?.teamSize);

  async ngOnInit(): Promise<void> {
    await this.loadState();
    this.scheduleRefresh();
  }

  ngOnDestroy(): void { if (this.pollTimer) clearTimeout(this.pollTimer); }

  setFormat(format: CompanionTournamentFormat): void { this.format.set(format); }
  setTournamentName(value: string): void { this.tournamentName.set(value); }
  setTeamName(value: string): void { this.teamName.set(value); }
  setUserSearch(value: string): void { this.userSearch.set(value); }
  setCompanionSearch(value: string): void { this.companionSearch.set(value); }

  async createTournament(): Promise<void> {
    if (!this.tournamentName().trim() || this.isSubmitting()) return;
    await this.runTournamentMutation(() => this.apiService.createCompanionTournament({
      name: this.tournamentName().trim(), format: this.format(), teamSize: 2,
    }), true);
  }

  async registerParticipant(userId: number): Promise<void> {
    const tournament = this.selectedTournament();
    if (!tournament) return;
    await this.runTournamentMutation(() => this.apiService.registerCompanionTournamentParticipant(tournament.id, userId));
  }

  async removeParticipant(userId: number): Promise<void> {
    const tournament = this.selectedTournament();
    if (!tournament) return;
    await this.runTournamentMutation(() => this.apiService.removeCompanionTournamentParticipant(tournament.id, userId));
  }

  async lockRegistration(): Promise<void> {
    const tournament = this.selectedTournament();
    if (!tournament || tournament.registeredParticipants.length < tournament.teamSize * (tournament.format === 'single_match' ? 2 : 4)) return;
    await this.runTournamentMutation(() => this.apiService.lockCompanionTournamentRegistration(tournament.id));
  }

  toggleTeamParticipant(userId: number): void {
    if (!this.isAdmin() || this.isSubmitting()) return;
    if (this.teamParticipantIds().includes(userId)) {
      this.teamParticipantIds.update((ids) => ids.filter((id) => id !== userId));
    } else if (this.teamParticipantIds().length < this.selectedTournament()?.teamSize!) {
      this.teamParticipantIds.update((ids) => [...ids, userId]);
    }
  }

  async saveTeam(): Promise<void> {
    const tournament = this.selectedTournament();
    if (!tournament || !this.isAdmin() || !this.canSaveTeam()) return;
    await this.runTournamentMutation(
      () => this.apiService.addCompanionTournamentTeam(tournament.id, { name: this.teamName().trim(), participantIds: this.teamParticipantIds() }),
      false,
      true
    );
  }

  async removeTeam(teamId: string): Promise<void> {
    const tournament = this.selectedTournament();
    if (!tournament) return;
    await this.runTournamentMutation(() => this.apiService.removeCompanionTournamentTeam(tournament.id, teamId));
  }

  async generateBracket(): Promise<void> {
    const tournament = this.selectedTournament();
    if (!tournament) return;
    await this.runTournamentMutation(() => this.apiService.generateCompanionTournamentBracket(tournament.id));
  }

  async resetTournament(): Promise<void> {
    const tournament = this.selectedTournament();
    if (!tournament || !this.isAdmin() || !window.confirm('Supprimer l’arbre et les drafts associés ? Les équipes seront conservées.')) return;
    await this.runTournamentMutation(() => this.apiService.resetCompanionTournament(tournament.id, tournament.version), false, true);
  }

  async resetRegistration(): Promise<void> {
    const tournament = this.selectedTournament();
    if (!tournament || !this.isAdmin() || !window.confirm('Recommencer les inscriptions ? Tous les joueurs et toutes les équipes seront supprimés.')) return;
    await this.runTournamentMutation(
      () => this.apiService.resetCompanionTournamentRegistration(tournament.id, tournament.version), false, true
    );
  }

  async tossCoin(): Promise<void> {
    const draft = this.activeDraft();
    if (!draft || !draft.canCoinToss || this.isSubmitting()) return;
    await this.updateDraft(() => this.apiService.tossCompanionDraftCoin(draft.id, draft.version));
  }

  async resetDraft(): Promise<void> {
    const draft = this.activeDraft();
    if (!draft || !this.isAdmin() || !window.confirm('Recommencer ce draft depuis le tirage au sort ?')) return;
    await this.updateDraft(() => this.apiService.resetCompanionDraft(draft.id, draft.version));
  }

  async performAction(companion: CompanionDraftCompanion, action: CompanionDraftActionType): Promise<void> {
    const draft = this.activeDraft();
    if (!draft || companion.status !== 'available' || !draft.canAct || draft.phase !== action || this.isSubmitting()) return;
    await this.updateDraft(() => this.apiService.performCompanionDraftAction(draft.id, action, { companionId: companion.id, version: draft.version }));
  }

  async recordWinner(teamId: string): Promise<void> {
    const tournament = this.selectedTournament(); const match = this.currentMatch();
    if (!tournament || !match || !this.isAdmin()) return;
    await this.runTournamentMutation(() => this.apiService.recordCompanionTournamentWinner(tournament.id, match.matchId, teamId, tournament.version));
  }

  cardImage(companion: CompanionDraftCompanion): string | null { return this.failedImages().has(companion.id) ? null : companion.image?.trim() || null; }
  markImageFailed(id: number): void { this.failedImages.update((failed) => new Set(failed).add(id)); }
  isTeamParticipant(userId: number): boolean { return this.teamParticipantIds().includes(userId); }

  phaseState(step: 'coin_toss' | 'ban' | 'pick' | 'result'): 'done' | 'current' | 'future' {
    const draft = this.activeDraft(); const match = this.currentMatch();
    if (!draft || !match) return 'future';
    if (step === 'coin_toss') return draft.phase === 'coin_toss' ? 'current' : 'done';
    if (step === 'ban') return draft.phase === 'coin_toss' ? 'future' : draft.phase === 'ban' ? 'current' : 'done';
    if (step === 'pick') return draft.phase === 'coin_toss' || draft.phase === 'ban' ? 'future' : draft.phase === 'pick' ? 'current' : 'done';
    return match.resultStatus === 'complete' ? 'done' : draft.phase === 'complete' ? 'current' : 'future';
  }

  teamNameForId(teamId: string | null): string { return this.selectedTournament()?.teams.find((team) => team.teamId === teamId)?.name ?? 'À déterminer'; }

  private async loadState(): Promise<void> {
    try {
      const access = await this.apiService.getCompanionDraftAccess();
      const tournaments = await this.apiService.getCompanionTournaments();
      this.applyState(access, tournaments);
      if (access.isAdmin) this.users.set(await this.apiService.getCompanionDraftUsers());
    } catch (error: unknown) { this.error.set(this.errorMessage(error, 'Accès aux tournois impossible.')); }
    finally { this.isLoading.set(false); }
  }

  private async refresh(): Promise<void> {
    if (this.isSubmitting() || this.isRefreshing) { this.scheduleRefresh(); return; }
    this.isRefreshing = true;
    const requestEpoch = ++this.stateEpoch;
    try {
      const [access, tournaments] = await Promise.all([
        this.apiService.getCompanionDraftAccess(), this.apiService.getCompanionTournaments(),
      ]);
      if (requestEpoch === this.stateEpoch) this.applyState(access, tournaments);
    } catch { /* Retain the current state until polling succeeds. */ }
    finally { this.isRefreshing = false; this.scheduleRefresh(); }
  }

  private findCurrentMatch(tournament: CompanionTournamentState | null): CompanionTournamentMatch | null {
    if (!tournament) return null;
    const matches = tournament.rounds.flatMap((round) => round.matches);
    return matches.find((match) => match.draft && match.draft.phase !== 'complete') ?? matches.find((match) => match.resultStatus === 'ready') ?? null;
  }

  private async updateDraft(request: () => Promise<CompanionDraftState>): Promise<void> {
    this.stateEpoch += 1; this.isSubmitting.set(true); this.actionError.set(null);
    try { await request(); await this.refreshAfterMutation(); } catch (error: unknown) { this.actionError.set(this.errorMessage(error, 'Action refusée par le serveur.')); } finally { this.isSubmitting.set(false); }
  }

  private async runTournamentMutation(request: () => Promise<CompanionTournamentState>, selectNew = false, clearTeam = false): Promise<void> {
    this.stateEpoch += 1; this.isSubmitting.set(true); this.actionError.set(null);
    try {
      const tournament = await request();
      if (selectNew) { this.tournaments.update((items) => [tournament, ...items]); this.selectedTournamentId.set(tournament.id); this.tournamentName.set(''); this.clearPhaseState(); }
      else this.applyState(this.access(), this.tournaments().map((item) => item.id === tournament.id ? tournament : item));
      if (clearTeam) this.clearTeamDraft();
    } catch (error: unknown) { this.actionError.set(this.errorMessage(error, 'La mise à jour du tournoi a échoué.')); }
    finally { this.isSubmitting.set(false); }
  }

  private clearTeamDraft(): void { this.teamName.set(''); this.teamParticipantIds.set([]); }
  private clearPhaseState(): void { this.clearTeamDraft(); this.userSearch.set(''); this.companionSearch.set(''); this.failedImages.set(new Set()); this.actionError.set(null); }
  private scheduleRefresh(): void {
    if (!this.pollTimer) this.pollTimer = setTimeout(() => { this.pollTimer = null; void this.refresh(); }, 4_000);
  }
  private async refreshAfterMutation(): Promise<void> {
    const requestEpoch = ++this.stateEpoch;
    const [access, tournaments] = await Promise.all([
      this.apiService.getCompanionDraftAccess(), this.apiService.getCompanionTournaments(),
    ]);
    if (requestEpoch === this.stateEpoch) this.applyState(access, tournaments);
  }
  private applyState(access: CompanionDraftAccess | null, tournaments: CompanionTournamentState[]): void {
    const previous = this.selectedTournament();
    const selected = tournaments.find((item) => item.status !== 'complete') ?? null;
    this.access.set(access);
    this.tournaments.set(tournaments);
    this.selectedTournamentId.set(selected?.id ?? null);
    if (previous?.id !== selected?.id || previous?.status !== selected?.status) this.clearPhaseState();
  }
  private matchesSearch(user: CompanionDraftUser, query: string): boolean {
    const searchable = `${user.dofus_username} ${user.class ?? ''}`;
    return this.normalize(searchable).includes(this.normalize(query));
  }
  private normalize(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(); }
  private errorMessage(error: unknown, fallback: string): string { return error instanceof HttpErrorResponse && typeof error.error?.message === 'string' ? error.error.message : fallback; }
}
