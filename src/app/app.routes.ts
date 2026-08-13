import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';

export function libraryRouteMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments[0]?.path !== 'library') {
    return null;
  }

  return {
    consumed: segments
  };
}

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((component) => component.HomeComponent)
  },
  {
    path: 'succes',
    loadComponent: () =>
      import('./pages/successes/successes.component').then(
        (component) => component.SuccessesComponent
      )
  },
  {
    path: 'succes/demandes',
    loadComponent: () =>
      import('./pages/success-requests/success-requests.component').then(
        (component) => component.SuccessRequestsComponent
      )
  },
  {
    path: 'classement',
    loadComponent: () =>
      import('./pages/leaderboard/leaderboard.component').then(
        (component) => component.LeaderboardComponent
      )
  },
  {
    matcher: libraryRouteMatcher,
    loadComponent: () =>
      import('./pages/library/library.component').then(
        (component) => component.LibraryComponent
      )
  },
  {
    path: 'devblog',
    loadComponent: () =>
      import('./pages/devblog/devblog.component').then(
        (component) => component.DevblogComponent
      )
  },
  {
    path: 'devblog/:id',
    loadComponent: () =>
      import('./pages/devblog-post/devblog-post.component').then(
        (component) => component.DevblogPostComponent
      )
  },
  {
    path: 'succes_saison-2',
    loadComponent: () =>
      import('./pages/success-season-2/success-season-2.component').then(
        (component) => component.SuccessSeason2Component
      )
  },
  {
    path: 'outils/roue-des-donjons',
    loadComponent: () =>
      import('./pages/dungeon-wheel/dungeon-wheel.component').then(
        (component) => component.DungeonWheelComponent
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];
