import { Component } from '@angular/core';
import { Routes } from '@angular/router';

export const routes: Routes = [
    {path:'', loadComponent: ()=> import('./page/home/home.component').then((m) => m.HomeComponent) },
    {path:'contact', loadComponent: ()=> import('./page/contact/contact.component').then((m) => m.ContactComponent) }
];
