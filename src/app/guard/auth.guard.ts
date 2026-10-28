import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthStore } from '../store/auth/auth.store';
import { environment } from '../../environments/environment';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.loggedIn()) return true;
  return new RedirectCommand(router.parseUrl('/auth'));
};

// Temporary, for testing: dev builds open the nutrition pages without login (logged-out
// visitors see sample data); production keeps them behind login.
export const nutritionGuard: CanActivateFn = (route, state) =>
  environment.production ? authGuard(route, state) : true;

// Pages only the site owner may open; a logged-in viewer is sent to the nutrition plans instead.
export const ownerGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.loggedIn()) return new RedirectCommand(router.parseUrl('/auth'));
  if (authStore.isOwner()) return true;
  return new RedirectCommand(router.parseUrl('/nutrition'));
};

export const authLoginGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.loggedIn()) return true;
  return new RedirectCommand(router.parseUrl(authStore.isOwner() ? '/resume' : '/nutrition'));
};
