import { Routes } from '@angular/router';

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
    path: '**',
    redirectTo: ''
  }
];
