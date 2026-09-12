export interface NavbarItem {
  name: string;
  adminOnly?: boolean;
  draftAccess?: boolean;
  link?: string;
  children?: Array<{
    name: string;
    link: string;
    adminOnly?: boolean;
    draftAccess?: boolean;
  }>;
}

export const NAVBAR_ITEMS: NavbarItem[] = [
  {
    name: 'Accueil',
    link: '/'
  },
  {
    name: 'Succes',
    children: [
      {
        name: 'Saison 1',
        link: '/succes'
      },
      {
        name: 'Saison 2',
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
    name: 'Le Mynni Blog',
    link: '/devblog'
  },
  {
    name: 'Bibliotheque',
    link: '/library'
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
  }
];
