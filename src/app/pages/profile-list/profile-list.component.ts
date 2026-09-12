import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService, PublicPlayerProfile } from '../../services/api.service';
import {
  ProfileRoleDisplay,
  highestProfileRole,
  profileImage
} from '../../shared/profile-display';

@Component({
  selector: 'app-profile-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile-list.component.html',
  styleUrl: './profile-list.component.css'
})
export class ProfileListComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly profiles = signal<PublicPlayerProfile[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const profiles = await this.apiService.getPublicProfiles();
      this.profiles.set(
        profiles
          .filter((profile) => profile.presentation?.trim() && profile.class?.trim())
          .sort((left, right) =>
            left.dofus_username.localeCompare(right.dofus_username, 'fr', {
              sensitivity: 'base'
            })
          )
      );
    } catch {
      this.error.set('Impossible de charger la liste des profils pour le moment.');
    } finally {
      this.isLoading.set(false);
    }
  }

  picture(profile: PublicPlayerProfile): string {
    return profileImage(profile);
  }

  highestRole(profile: PublicPlayerProfile): ProfileRoleDisplay {
    return highestProfileRole(profile.roles);
  }
}
