import { Component, inject } from '@angular/core';
import { SidebarComponent } from '../../core/sidebar/sidebar.component';
import { BottombarComponent } from '../../core/bottombar/bottombar.component';
import { ResponsiveService } from '../../service/responsive-service/responsive.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TUserNavInfo } from '../../types/TUserNavItems';
import { ACTIVITY_SECTIONS, DOCUMENT_SECTIONS, JOB_SECTIONS, SCHEDULE_SECTIONS } from './information.sections';

@Component({
  selector: 'app-information',
  imports: [SidebarComponent, BottombarComponent, CommonModule, RouterOutlet],
  templateUrl: './information.component.html',
  styleUrl: './information.component.css',
})
export class InformationComponent {

  private readonly responsiveService = inject(ResponsiveService);
  deviceType$ = this.responsiveService.deviceType$;

  userNavbarInfo: TUserNavInfo = [
    DOCUMENT_SECTIONS, 
    SCHEDULE_SECTIONS,
    // JOB_SECTIONS,
    ACTIVITY_SECTIONS,
  ];

}
