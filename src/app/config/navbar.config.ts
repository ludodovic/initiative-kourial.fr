export interface NavbarItem {
  name: string;
  link?: string;
  children?: Array<{
    name: string;
    link: string;
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
        name: 'Liste',
        link: '/succes'
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
    name: 'Bibliotheque',
    link: '/library'
  }
];
