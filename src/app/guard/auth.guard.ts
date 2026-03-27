import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from '../service/auth-service/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIN = authService.isAuthenticated()

  if(isLoggedIN) {return true};
  return new RedirectCommand(router.parseUrl('/auth') )
};


export const authLoginGuard: CanActivateFn = (route, state) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIN = authService.isAuthenticated()

  if(!isLoggedIN) {return true};
  return new RedirectCommand(router.parseUrl('/resume') )
};
