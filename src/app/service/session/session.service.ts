import { inject, Injectable } from '@angular/core';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly superbaseClient = inject(SUPERBASE_CLIENT);


  async getSession() {
    return this.superbaseClient?.auth.getSession();
  }

  
}
