import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../service/auth-service/auth.service';
import { SuperBaseService } from '../../service/superbase-service/superbase.service';
import { ToastService } from '../../service/toast-service/toast.service';
import { ResumeThumbnailComponent } from '../../componenets/resume-thumbnail/resume-thumbnail.component';
import { CommonModule } from '@angular/common';
import { TResume } from '../../types/TResume';
import { ButtonComponent } from '../../components/button/button.component';
import { BUTTON } from '../../types/TButtons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-resume-collection',
  imports: [ResumeThumbnailComponent, CommonModule, ButtonComponent, FaIconComponent],
  templateUrl: './resume-collection.component.html',
  styleUrl: './resume-collection.component.css',
})
export class ResumeCollectionComponent implements OnInit {


  private authServicer = inject(AuthService);
  private readonly dbClient = inject(SuperBaseService);
  private readonly toasterService = inject(ToastService)

  resumes = signal<TResume[]>([])

  buttonType = BUTTON.OUTLINE
  downloadIcon = faDownload;
  tableName = "resume_collection";

  ngOnInit(): void {
      this.fetchResumes()
  }

  //handlers
  signOutHandler() {
    this.authServicer.signOut()
  }

  async download(resume: TResume) {
    const fileName = resume.title + '.'+resume.fileType;
    debugger
    this.dbClient.getResume(fileName).then((response) => {
      const url = URL.createObjectURL(response.data.data);
      const link = document.createElement('a');
      link.href = url; // Use the URL directly
      link.setAttribute('download', fileName); // Set the file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      }).catch((error) => {
        console.error('Error downloading resume:', error);
    })
  }

  getLanguageLabel(language: string): string {
    switch (language) {
      case 'en': return $localize`:@@resumeCollection.lang.en:🇬🇧 ENGLISH`;
      case 'fr': return $localize`:@@resumeCollection.lang.fr:🇫🇷 FRENCH`;
      default:   return $localize`:@@resumeCollection.lang.hi:🇮🇳 HINDI`;
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'stage': return $localize`:@@resumeCollection.type.internship:Internship`;
      case 'CDI':   return $localize`:@@resumeCollection.type.fullTime:Full-time`;
      default:      return $localize`:@@resumeCollection.type.fixedTerm:Fixed-term`;
    }
  }

  getDownloadLabel(language: string): string {
    return language === 'fr'
      ? $localize`:@@resumeCollection.download.fr:Télécharger`
      : $localize`:@@resumeCollection.download.en:Download`;
  }

  private async fetchResumes(){
    const resumesInformation = await this.dbClient.getTableData(this.tableName)
    if(resumesInformation.error) {
      this.toasterService.error($localize`:@@resumeCollection.toast.fetchError:Error fetching the resumes`);
      return;
    }

    const resumes = resumesInformation.data.map(file => this.mapInformationToResume(file))
    const t: TResume[] = await Promise.all(
            resumes.map(async resume => {
              const fileName = resume.title + '.' + resume.fileType
              const url = await this.dbClient.getSignedURL('resumes', fileName);
              return { ...resume, pdfUrl: url.data?.signedUrl };
            })
          );

    this.resumes.set(t)
  }


  private mapInformationToResume(file: any):TResume {
    return {
      id: file.id, 
      language: file.language,
      updated_at: file.created_at,
      title: file.file_name, 
      type: file.type,
      jobTitle: file.job_title,
      fileType: file.file_type,
      isNew: file.is_new
    }
  }


}
