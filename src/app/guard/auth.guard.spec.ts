import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RedirectCommand,
  RouterStateSnapshot,
} from '@angular/router';

import { authGuard, nutritionGuard } from './auth.guard';
import { AuthStore } from '../store/auth/auth.store';
import { environment } from '../../environments/environment';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

describe('nutritionGuard', () => {
  const run = () =>
    TestBed.runInInjectionContext(() =>
      nutritionGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthStore, useValue: { loggedIn: signal(false) } }],
    });
  });

  it('lets a logged-out visitor in on a dev build', () => {
    expect(run()).toBe(true);
  });

  it('sends a logged-out visitor to /auth on a production build', () => {
    environment.production = true;
    try {
      const result = run();
      expect(result).toBeInstanceOf(RedirectCommand);
      expect((result as RedirectCommand).redirectTo.toString()).toBe('/auth');
    } finally {
      environment.production = false;
    }
  });
});
