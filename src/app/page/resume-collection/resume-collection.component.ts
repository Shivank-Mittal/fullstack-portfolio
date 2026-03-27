import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../service/auth-service/auth.service';
import { SuperBaseService } from '../../service/superbase-service/superbase.service';
import { ToastService } from '../../service/toast-service/toast.service';

@Component({
  selector: 'app-resume-collection',
  imports: [],
  templateUrl: './resume-collection.component.html',
  styleUrl: './resume-collection.component.css',
})
export class ResumeCollectionComponent implements OnInit {


  private authServicer = inject(AuthService);
  private readonly dbClient = inject(SuperBaseService);
  private readonly toasterService = inject(ToastService)

  resumes = signal<any[]>([])


  ngOnInit(): void {
      this.fetchResumes()
  }

  //handlers
  signOutHandler() {
    this.authServicer.signOut()
  }

  private async fetchResumes(){
    const information = await this.dbClient.getAllResumes();
    if(information.error) {
      this.toasterService.error("Error fetching the resumes");
      return;
    }
    debugger

    this.resumes.set(information.data)

  }

}
