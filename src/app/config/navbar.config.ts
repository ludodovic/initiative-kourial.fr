export interface NavbarItem {
  name: string;
  link?: string;
  requiresAuthentication?: boolean;
  children?: Array<{
    name: string;
    link: string;
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
