import { Routes } from '@angular/router';
import { authGuard, authLoginGuard } from './guard/auth.guard';

export const routes: Routes = [
    {path:'', loadComponent: ()=> import('./page/home/home.component').then((m) => m.HomeComponent) },
    {path:'contact', loadComponent: ()=> import('./page/contact/contact.component').then((m) => m.ContactComponent) },
    {path:'auth', loadComponent: ()=> import('./components/auth/auth.component').then((m) => m.AuthComponent), canActivate: [authLoginGuard] },
    {
        path: '',
        loadComponent: () => import('./page/information/information.component').then((m) => m.InformationComponent),
        
        canActivate: [authGuard],
        children: [
            { path: 'resume', loadComponent: ()=> import('./page/resume-collection/resume-collection.component').then((m) => m.ResumeCollectionComponent)},
            { path: 'calendar', loadComponent: ()=> import('./features/calender/calender.component').then((m) => m.CalenderComponent)},
        ]
    },
];
