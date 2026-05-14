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
        scopes:
          'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          access_type: 'offline',
        },
        redirectTo: environment.authRedirectUrl,
      },
    });
  }

  async fetchUser() {
    return this.superbaseClient?.auth.getUser();
  }

  async fetchSession() {
    return this.superbaseClient?.auth.getSession();
  }

  async signOut() {
    await this.superbaseClient?.auth.signOut();
  }

  async upsert() {
    if (!this.superbaseClient) return;
    const result = await this.fetchSession();
    const session = result?.data?.session;
    if (!session) return;

    if (session.provider_refresh_token) {
      // First-time auth or re-authorization: store the new refresh token
      await this.superbaseClient.from('user_integrations').upsert({
        user_id: session.user.id,
        google_refresh_token: session.provider_refresh_token,
      });
    } else {
      // Subsequent logins: ensure the row exists without overwriting the stored token
      await this.superbaseClient
        .from('user_integrations')
        .upsert({ user_id: session.user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
    }
  }
}
