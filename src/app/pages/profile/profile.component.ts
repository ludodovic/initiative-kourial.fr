import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiService, PublicPlayerProfile } from '../../services/api.service';
import {
  ProfileRoleDisplay,
  formatProfileBirthday,
  highestProfileRole,
  profileImage
} from '../../shared/profile-display';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly profile = signal<PublicPlayerProfile | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    const dofusUsername = this.route.snapshot.paramMap.get('dofus_username');
    if (!dofusUsername) {
      this.error.set('Profil introuvable.');
      this.isLoading.set(false);
      return;
    }

    try {
      this.profile.set(await this.apiService.getPublicProfile(dofusUsername));
    } catch {
      this.error.set('Ce profil est introuvable ou indisponible pour le moment.');
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

  birthday(profile: PublicPlayerProfile): string | null {
    return formatProfileBirthday(profile.birthday);
  }

  classIcon(className: string): string {
    return `/assets/class_icons/${className === 'Cra' ? 'Crâ' : className}.png`;
  }
}
