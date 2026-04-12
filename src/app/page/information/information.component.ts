import { Component, inject } from '@angular/core';
import { SidebarComponent } from '../../core/sidebar/sidebar.component';
import { BottombarComponent } from '../../core/bottombar/bottombar.component';
import { ResponsiveService } from '../../service/responsive-service/responsive.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TUserNavInfo } from '../../types/TUserNavItems';
import { faBars, faGripVertical, faCalendar, faHourglassHalf, faGear } from '@fortawesome/free-solid-svg-icons';

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
    {
      name: 'Documents',
      id: 'documents',
      enabled: true,
      items: [
        {name: 'Resumes', id: 'resume', enabled: true, router: '/resume', icon: faBars},
        {name: 'Cover letters', id: 'cover-letter', enabled: false, router: '/cover-letter', icon: faGripVertical},
    ]},
    {
      name: 'Schedule',
      id: 'schedule',
      enabled: true,
      items: [
        {name: 'Calendar', id: 'calendar', enabled: true, router: '/calendar', icon: faCalendar},
        {name: 'Availability', id: 'availability', enabled: false, router: '/availability', icon: faHourglassHalf},
      ]
    },
    {
      name: 'Activity',
      id: 'activity',
      enabled: true,
      items: [
        {name: 'Settings', id: 'settings', enabled: false, router: '/settings',icon: faGear,},
      ]
    },
  ]



}
