import { inject, Injectable } from '@angular/core';
import { AuthStore } from '../../store/auth/auth.store';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly superbaseClient = inject(SUPERBASE_CLIENT);

  async signInWithGoogle() {
    this.superbaseClient?.auth.signInWithOAuth({provider: 'google', options: {redirectTo: environment.authRedirectUrl}});
  }

  async fetchUser() {
    return this.superbaseClient.auth.getUser();
  }

  async fetchSession() {
    return this.superbaseClient.auth.getSession();
  }

  async signOut() {
    await this.superbaseClient.auth.signOut();
  }

}

