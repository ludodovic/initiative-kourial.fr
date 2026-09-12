import { Component, OnDestroy, computed, effect, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';

import {
  CompanionDraftAction, CompanionDraftActionType, CompanionDraftCompanion, CompanionDraftState, CompanionDraftTeam,
} from '../../services/api.service';

interface DraftReveal {
  action: CompanionDraftAction;
  companion: CompanionDraftCompanion;
}

@Component({
  selector: 'app-draft-arena',
  imports: [NgClass],
  templateUrl: './draft-arena.component.html',
  styleUrl: './draft-arena.component.css',
})
export class DraftArenaComponent implements OnDestroy {
  readonly draft = input.required<CompanionDraftState>();
  readonly search = input.required<string>();
  readonly isSubmitting = input.required<boolean>();
  readonly searchChange = output<string>();
  readonly action = output<{ companion: CompanionDraftCompanion; action: CompanionDraftActionType }>();

  readonly failedImages = signal<Set<number>>(new Set());
  readonly reveal = signal<DraftReveal | null>(null);
  readonly visibleCompanions = computed(() => this.draft().companions.filter(
    (companion) => this.normalize(companion.name).includes(this.normalize(this.search()))
  ));
  private draftId: string | null = null;
  private seenActionCount = 0;
  private revealQueue: DraftReveal[] = [];
  private revealTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => this.queueNewActions(this.draft()));
  }

  ngOnDestroy(): void {
    if (this.revealTimer) clearTimeout(this.revealTimer);
  }

  cardImage(companion: CompanionDraftCompanion): string | null {
    return this.failedImages().has(companion.id) ? null : companion.image?.trim() || null;
  }

  markImageFailed(id: number): void {
    this.failedImages.update((failed) => new Set(failed).add(id));
  }

  actionsFor(team: CompanionDraftTeam, type: CompanionDraftActionType): CompanionDraftCompanion[] {
    const companions = new Map(this.draft().companions.map((companion) => [companion.id, companion]));
    return this.draft().actions
      .filter((action) => action.teamId === team.id && action.type === type)
      .map((action) => companions.get(action.companionId))
      .filter((companion): companion is CompanionDraftCompanion => companion !== undefined);
  }

  actionLabel(type: CompanionDraftActionType): string { return type === 'ban' ? 'Bannir' : 'Choisir'; }

  teamName(teamId: string): string {
    return this.draft().teams.find((team) => team.id === teamId)?.name ?? `Équipe ${teamId}`;
  }

  emitAction(companion: CompanionDraftCompanion): void {
    const phase = this.draft().phase;
    if (phase === 'ban' || phase === 'pick') this.action.emit({ companion, action: phase });
  }

  onSearch(value: string): void { this.searchChange.emit(value); }

  private queueNewActions(draft: CompanionDraftState): void {
    if (draft.id !== this.draftId) {
      this.draftId = draft.id;
      this.seenActionCount = draft.actions.length;
      this.revealQueue = [];
      this.reveal.set(null);
      this.failedImages.set(new Set());
      return;
    }
    if (draft.actions.length < this.seenActionCount) {
      this.seenActionCount = draft.actions.length;
      this.revealQueue = [];
      this.reveal.set(null);
      return;
    }
    const companions = new Map(draft.companions.map((companion) => [companion.id, companion]));
    for (const action of draft.actions.slice(this.seenActionCount)) {
      const companion = companions.get(action.companionId);
      if (companion) this.revealQueue.push({ action, companion });
    }
    this.seenActionCount = draft.actions.length;
    this.showNextReveal();
  }

  private showNextReveal(): void {
    if (this.reveal() || this.revealQueue.length === 0) return;
    this.reveal.set(this.revealQueue.shift() ?? null);
    this.revealTimer = setTimeout(() => {
      this.reveal.set(null);
      this.revealTimer = null;
      this.showNextReveal();
    }, 1200);
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  }
}
