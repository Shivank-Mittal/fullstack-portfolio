import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withState, withComputed, withMethods, withHooks } from '@ngrx/signals';
import { computed } from '@angular/core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { ToastService } from '../../service/toast-service/toast.service';
import { environment } from '../../../environments/environment';
import { AuthUser } from '../../types/interfaces/IAuthUser';
import { AuthState } from '../../types/interfaces/IAuthState';
import { AuthService } from '../../service/auth-service/auth.service';

const initialState: AuthState = {
  loggedIn: false,
  user: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withDevtools('auth'),
  withState(initialState),
  withComputed((store) => ({
    avatarInfo: computed(() => {
      const loggedIn = store.loggedIn();
      const user = store.user();
      if (loggedIn && user) {
        return { loggedIn: true as const, src: user.avatarUrl, alt: user.fullName, name: user.fullName, size: 'md' };
      }
      return { loggedIn: false as const, src: '', alt: '', name: '', size: 'md' };
    }),
    isLoggedIn: computed(() => store.loggedIn()),
  })),
  withMethods((store) => {
    const supabaseClient = inject(SUPERBASE_CLIENT);
    const toastService = inject(ToastService);
    const router = inject(Router);
    const authService = inject(AuthService);

    function setUser(user: any) {
      patchState(store, {
        loggedIn: true,
        user: {
          id: user.id,
          email: user.email,
          avatarUrl: user.user_metadata?.avatar_url ?? '',
          fullName: user.user_metadata?.full_name ?? '',
        },
      });
    }

    function clearUser() {
      patchState(store, { loggedIn: false, user: null });
    }

    return {
      async signInWithGoogle() {
        await authService.signInWithGoogle()
      },

      async verifyLogin() {
        const { data, error } = await supabaseClient.auth.getSession();
        await authService.upsert();
        const user = data?.session?.user ?? undefined;
        
        if (error || !user) {
          clearUser();
          console.error('Sign-in failed:', error);
          toastService.error($localize`:@@auth.toast.googleSignInFailed:Google sign-in failed. Please try again.`);
          return;
        }
        setUser(user);
        toastService.success($localize`:@@auth.toast.loggedIn:Successfully logged in`);
      },

      async signOut() {
        const wasLoggedIn = store.loggedIn();
        await supabaseClient.auth.signOut();
        clearUser();
        toastService.success($localize`:@@auth.toast.loggedOut:Successfully logged out`);
        if (wasLoggedIn) {
          router.navigateByUrl('/');
        }
      },

      isAuthenticated(): boolean {
        return store.loggedIn();
      },
    };
  }),
  withHooks(store => ({
    onInit(){
      store.verifyLogin();
    }
  }))
);
