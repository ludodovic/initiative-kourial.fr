import { PublicPlayerProfile } from '../services/api.service';

export interface ProfileRoleDisplay {
  name: 'Initiateur' | 'Assemblée' | 'Conseiller';
  color: string;
  textColor: string;
}

const PROFILE_ROLES: ProfileRoleDisplay[] = [
  { name: 'Initiateur', color: '#9b59b6', textColor: '#ffffff' },
  { name: 'Assemblée', color: '#576bff', textColor: '#ffffff' },
  { name: 'Conseiller', color: '#ffb7eb', textColor: '#011638' }
];

export function highestProfileRole(roles: string[] | null | undefined): ProfileRoleDisplay {
  const normalizedRoles = new Set(
    (roles ?? []).map((role) => role.trim().toLocaleLowerCase('fr'))
  );

  return [...PROFILE_ROLES]
    .reverse()
    .find((role) => normalizedRoles.has(role.name.toLocaleLowerCase('fr')))
    ?? PROFILE_ROLES[0];
}

export function profileImage(profile: PublicPlayerProfile): string {
  const pictureUrl = normalizeProfilePictureUrl(profile.profile_picture_url);
  if (pictureUrl) {
    return pictureUrl;
  }

  const className = profile.class === 'Cra' ? 'Crâ' : profile.class;
  return `/assets/class_icons/${className || 'NoClass'}.png`;
}

export function normalizeProfilePictureUrl(pictureUrl: string | null | undefined): string | null {
  const value = pictureUrl?.trim();
  if (!value) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  const path = value.startsWith('/') ? value : `/${value}`;
  if (path.startsWith('/uploads/profile_pictures/')) {
    return path.replace('/uploads/profile_pictures/', '/uploads/profile-pictures/');
  }

  if (path.startsWith('/profile_pictures/') || path.startsWith('/profile-pictures/')) {
    return `/uploads/profile-pictures/${path.split('/').slice(2).join('/')}`;
  }

  return path;
}

export function formatProfileBirthday(birthday: string | null): string | null {
  const match = birthday?.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }

  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(
    new Date(2000, Number(match[1]) - 1, Number(match[2]))
  );
}
