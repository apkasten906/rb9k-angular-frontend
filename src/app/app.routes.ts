import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
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
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/user-profile/user-profile.component').then((m) => m.UserProfileComponent),
  },
  {
    path: 'career-history',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/career-history/career-history-list/career-history-list.component').then(
            (m) => m.CareerHistoryListComponent
          ),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/career-history/career-history-form/career-history-form.component').then(
            (m) => m.CareerHistoryFormComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/career-history/career-history-detail/career-history-detail.component').then(
            (m) => m.CareerHistoryDetailComponent
          ),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./features/career-history/career-history-form/career-history-form.component').then(
            (m) => m.CareerHistoryFormComponent
          ),
      },
    ],
  },
];
