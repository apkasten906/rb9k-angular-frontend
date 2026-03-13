import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'applications', pathMatch: 'full' },
  {
    path: 'applications',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/applications/application-list/application-list.component').then(
            (m) => m.ApplicationListComponent
          ),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/applications/application-form/application-form.component').then(
            (m) => m.ApplicationFormComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/applications/application-detail/application-detail.component').then(
            (m) => m.ApplicationDetailComponent
          ),
      },
    ],
  },
];
