import { Component, OnInit, inject, signal } from '@angular/core';

import {
  ApiService,
  SuccessValidationRequest,
  SuccessValidationStatus
} from '../../services/api.service';

interface RequestSection {
  status: SuccessValidationStatus;
  title: string;
  emptyText: string;
  requests: SuccessValidationRequest[];
}

@Component({
  selector: 'app-success-requests',
  templateUrl: './success-requests.component.html',
  styleUrl: './success-requests.component.css'
})
export class SuccessRequestsComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly sections = signal<RequestSection[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const validations = await this.apiService.getSuccessValidations();

      this.sections.set([
        {
          status: 'pending',
          title: 'Demandes en attente',
          emptyText: 'Aucune demande en attente.',
          requests: validations.pending
        },
        {
          status: 'approved',
          title: 'Demandes validees',
          emptyText: 'Aucune demande validee.',
          requests: validations.approved
        },
        {
          status: 'refused',
          title: 'Demandes refusees',
          emptyText: 'Aucune demande refusee.',
          requests: validations.refused
        }
      ]);
    } catch {
      this.error.set('Impossible de charger vos demandes de validation pour le moment.');
    } finally {
      this.isLoading.set(false);
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  statusLabel(status: SuccessValidationStatus): string {
    const labels: Record<SuccessValidationStatus, string> = {
      pending: 'En attente',
      approved: 'Validee',
      refused: 'Refusee'
    };

    return labels[status];
  }
}
