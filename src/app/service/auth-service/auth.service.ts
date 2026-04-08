import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { ToastService } from '../toast-service/toast.service';
import { BehaviorSubject, filter, pairwise } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly superbaseClient = inject(SUPERBASE_CLIENT);
  private readonly toasterService = inject(ToastService);
  private readonly routerService = inject(Router);

  private readonly loginSubject = new BehaviorSubject<{loggedIn: false} | {loggedIn: true, user: any}>({loggedIn: false})

  readonly auth$ = this.loginSubject.asObservable();

  private readonly authStatus$ = this.auth$.pipe(
    pairwise(),
    filter(value => {
      const previousValue = value[0].loggedIn;
      const currentValue = value[1].loggedIn;
      return ( previousValue === true && currentValue === false )
    })
  )


  constructor() {
    // route to the main page when we logout after being logged in
    this.authStatus$.subscribe((value) =>{
      this.routerService.navigateByUrl('/')
    })
  }

  isAuthenticated() {
    return this.loginSubject.value.loggedIn
  }

  async signInWithGoogle() {
    this.superbaseClient?.auth.signInWithOAuth({provider: 'google', options: {redirectTo: environment.authRedirectUrl}});
  }

  async verifyLogin() {
    if(!this.superbaseClient) {
      console.warn('Superbase is not connected')
      return;
    }
    const {data, error} = await this.superbaseClient.auth.getUser();
    const user = data.user || undefined
    if(error || !user) this.errorSignInHandler(error);    
    if(user) this.successSignInHandler(data.user);
  }

  async signOut() {
    this.superbaseClient.auth.signOut();
    this.loginSubject.next({loggedIn: false});
    this.toasterService.success($localize`:@@auth.toast.loggedOut:Successfully logged out`)
  }


  private successSignInHandler(user: any) {
    this.loginSubject.next({loggedIn: true, user});
    this.toasterService.success($localize`:@@auth.toast.loggedIn:Successfully logged in`);
    this.showToaster($localize`:@@auth.toast.loggedIn:Successfully logged in`, 'success');
  }

  private errorSignInHandler(error: any) {
    this.loginSubject.next({loggedIn: false});
    console.error('Google sign-in failed:', error);
    this.showToaster($localize`:@@auth.toast.googleSignInFailed:Google sign-in failed. Please try again.`, 'error');
  }


  private showToaster(message: string, type: 'success' | 'error' | 'neutral') {
    switch (type) {
      case 'success':
        this.toasterService.success(message);
        break;
      case 'error':
        this.toasterService.error(message);
        break;
      case 'neutral':
        this.toasterService.neutral(message);
        break;
    }
  }
  
}
