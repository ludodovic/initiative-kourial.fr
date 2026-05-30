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
    path: '**',
    redirectTo: ''
  }
];
