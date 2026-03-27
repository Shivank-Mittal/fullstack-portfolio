import { Routes } from '@angular/router';
import { authGuard, authLoginGuard } from './guard/auth.guard';

export const routes: Routes = [
    {path:'', loadComponent: ()=> import('./page/home/home.component').then((m) => m.HomeComponent) },
    {path:'contact', loadComponent: ()=> import('./page/contact/contact.component').then((m) => m.ContactComponent) },
    {path:'resume', loadComponent: ()=> import('./page/resume-collection/resume-collection.component').then((m) => m.ResumeCollectionComponent), canActivate: [authGuard] },
    {path:'auth', loadComponent: ()=> import('./components/auth/auth.component').then((m) => m.AuthComponent), canActivate: [authLoginGuard] }
];
