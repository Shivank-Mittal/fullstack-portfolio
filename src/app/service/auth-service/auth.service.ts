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
    this.superbaseClient?.auth.signInWithOAuth({
      provider: 'google', 
      options: {
       scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly',
       queryParams: {
          access_type: 'offline',
          prompt: 'consent', // Required to get the refresh_token every time
        },
        redirectTo: environment.authRedirectUrl
      }
    });


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

  async upsert() {
    const { data: { session } } = await this.fetchSession();
    if (session?.provider_refresh_token) {
      await this.superbaseClient
        .from('user_integrations')
        .upsert({ 
          user_id: session.user.id,
          provider_refresh_token: session.provider_refresh_token,
        });
    }
  }

}

