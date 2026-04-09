import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthStore } from '../store/auth/auth.store';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.loggedIn()) return true;
  return new RedirectCommand(router.parseUrl('/auth'));
};

export const authLoginGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.loggedIn()) return true;
  return new RedirectCommand(router.parseUrl('/resume'));
};
