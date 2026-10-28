import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RedirectCommand,
  RouterStateSnapshot,
} from '@angular/router';

import { authGuard, authLoginGuard, nutritionGuard, ownerGuard } from './auth.guard';
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

describe('ownerGuard', () => {
  const run = (loggedIn: boolean, isOwner: boolean) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { loggedIn: signal(loggedIn), isOwner: signal(isOwner) } },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      ownerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  };
  const target = (result: unknown) => (result as RedirectCommand).redirectTo.toString();

  it('lets the owner in', () => {
    expect(run(true, true)).toBe(true);
  });

  it('sends a logged-in viewer to the nutrition plans', () => {
    expect(target(run(true, false))).toBe('/nutrition');
  });

  it('sends a logged-out visitor to /auth', () => {
    expect(target(run(false, false))).toBe('/auth');
  });
});

describe('authLoginGuard', () => {
  const run = (loggedIn: boolean, isOwner: boolean) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { loggedIn: signal(loggedIn), isOwner: signal(isOwner) } },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      authLoginGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  };
  const target = (result: unknown) => (result as RedirectCommand).redirectTo.toString();

  it('shows the login page to a logged-out visitor', () => {
    expect(run(false, false)).toBe(true);
  });

  it('sends the owner to the resumes', () => {
    expect(target(run(true, true))).toBe('/resume');
  });

  it('sends a viewer to the nutrition plans', () => {
    expect(target(run(true, false))).toBe('/nutrition');
  });
});
