import { inject, Injectable } from '@angular/core';
import { SuperBaseService } from '../superbase-service/superbase.service';
import { EFunction } from '../superbase-service/functions';

@Injectable({
  providedIn: 'root',
})
export class GmailService {

  private readonly superbaseClient = inject(SuperBaseService);


  async getEmails() {
    const emails = await this.superbaseClient.callFunctionWithHTTP(EFunction.GMAIL);
    console.log("Emails are");
    return emails
  }

  async fetchEmails(mode: 'incremental' | 'range', opts: { days?: number; after?: string; before?: string } = {} ) {
    const body = {mode, ...opts}
    const emails = await this.superbaseClient.callFunctionWithHTTP(EFunction.GMAIL_FETCH, { body });
    console.log("Fetched Emails are", emails);
    return emails
  }
  
}
