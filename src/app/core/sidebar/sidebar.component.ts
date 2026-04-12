import { Component, inject, input } from '@angular/core';
import { TUserNavInfo } from '../../types/TUserNavItems';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-sidebar',
  imports: [FaIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  router = inject(Router)

  navbarInfo = input.required<TUserNavInfo>();


  //Handlers 
  handleItemSelection(route: string) {
    this.router.navigateByUrl(route)
  }

}
