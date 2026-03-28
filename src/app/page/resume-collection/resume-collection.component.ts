import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../service/auth-service/auth.service';
import { SuperBaseService } from '../../service/superbase-service/superbase.service';
import { ToastService } from '../../service/toast-service/toast.service';
import { ResumeThumbnailComponent } from '../../componenets/resume-thumbnail/resume-thumbnail.component';
import { CommonModule } from '@angular/common';
import { TResume } from '../../types/TResume';
import { ButtonComponent } from '../../components/button/button.component';
import { BUTTON } from '../../types/TButtons';

@Component({
  selector: 'app-resume-collection',
  imports: [ResumeThumbnailComponent, CommonModule, ButtonComponent],
  templateUrl: './resume-collection.component.html',
  styleUrl: './resume-collection.component.css',
})
export class ResumeCollectionComponent implements OnInit {


  private authServicer = inject(AuthService);
  private readonly dbClient = inject(SuperBaseService);
  private readonly toasterService = inject(ToastService)

  resumes = signal<TResume[]>([])

  buttonType = BUTTON.Secondary

  ngOnInit(): void {
      this.fetchResumes()
  }

  //handlers
  signOutHandler() {
    this.authServicer.signOut()
  }

  async download(resume: TResume) {
    this.dbClient.getResume(resume.title).then((response) => {
        const url = URL.createObjectURL(response.data.data);
      const link = document.createElement('a');
      link.href = url; // Use the URL directly
      link.setAttribute('download', resume.title); // Set the file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      }).catch((error) => {
        console.error('Error downloading resume:', error);
    })
  }

  private async fetchResumes(){
    const information = await this.dbClient.getAllResumes();
    if(information.error) {
      this.toasterService.error("Error fetching the resumes");
      return;
    }


    
    const resumes = information.data.map(file => this.mapInformationToResume(file))
    const t: TResume[] = await Promise.all(
            resumes.map(async resume => {
              const url = await this.dbClient.getSignedURL('resumes', resume.title);
              return { ...resume, pdfUrl: url.data?.signedUrl };
            })
          );


    
    this.resumes.set(t)

  }


  private mapInformationToResume(file: any):TResume {
    return {id: file.id, title: file.name, tag: 'tech', updated_at: file.updated_at, }
  }


}
