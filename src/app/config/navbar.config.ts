export interface NavbarItem {
  name: string;
  adminOnly?: boolean;
  draftAccess?: boolean;
  link?: string;
  requiresAuthentication?: boolean;
  children?: Array<{
    name: string;
    link: string;
    adminOnly?: boolean;
    draftAccess?: boolean;
  }>;
}

export const NAVBAR_ITEMS: NavbarItem[] = [
  {
    name: 'Nos membres',
    requiresAuthentication: true,
    link: '/liste-profil'
  },
  {
    name: 'Succès',
    children: [
      {
        name: 'Classiques',
        link: '/succes'
      },
      {
        name: 'Donjon',
        link: '/succes_saison-2'
      },
      {
        name: 'Classement',
        link: '/classement'
      },
      {
        name: 'Mes demandes',
        link: '/succes/demandes'
      }
    ]
  },
  {
    name: 'Outils',
    children: [
      {
        name: 'Roue des donjons',
        link: '/outils/roue-des-donjons'
      },
      {
        name: 'Draft compagnons 2v2',
        link: '/outils/draft-compagnons',
        draftAccess: true
      }
    ]
  },
  {
    name: 'Le Mynni Blog',
    link: '/devblog'
  },
  {
    name: 'Bibliothèque',
    link: '/library'
  }
];
