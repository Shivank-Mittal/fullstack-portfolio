import { Routes } from '@angular/router';
import { authGuard, authLoginGuard, nutritionGuard } from './guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./page/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./page/contact/contact.component').then((m) => m.ContactComponent),
  },
  {
    path: 'auth',
    loadComponent: () => import('./components/auth/auth.component').then((m) => m.AuthComponent),
    canActivate: [authLoginGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./page/information/information.component').then((m) => m.InformationComponent),
    // Guards sit on each child: the nutrition pages are open in dev builds, the rest need login.
    children: [
      {
        path: 'resume',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./page/resume-collection/resume-collection.component').then(
            (m) => m.ResumeCollectionComponent,
          ),
      },
      {
        path: 'calendar',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/calender/calender.component').then((m) => m.CalenderComponent),
      },
      {
        path: 'nutrition/:date',
        canActivate: [nutritionGuard],
        loadComponent: () =>
          import('./features/nutrition/day/nutrition-day.component').then(
            (m) => m.NutritionDayComponent,
          ),
      },
      // { path: 'application', loadComponent: ()=> import('./features/applications/applications.component').then((m) => m.ApplicationsComponent)},
    ],
  },
];
