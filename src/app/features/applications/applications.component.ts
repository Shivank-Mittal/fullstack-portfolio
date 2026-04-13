import { Component, inject } from '@angular/core';
import { GmailService } from '../../service/gmail/gmail.service';

@Component({
  selector: 'app-applications',
  imports: [],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.css',
})
export class ApplicationsComponent {

  private readonly gmailService = inject(GmailService);


  // Handler
  async getEmails() {
    // this.gmailService.getEmails()
    const emails = await this.gmailService.fetchEmails('incremental', { days: 30 });
    console.log("Fetched Emails are", emails);
  }

}
