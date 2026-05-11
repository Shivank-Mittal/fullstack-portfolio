import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TUserNavInfo } from '../../types/TUserNavItems';

@Component({
  selector: 'app-bottombar',
  imports: [FaIconComponent],
  templateUrl: './bottombar.component.html',
  styleUrl: './bottombar.component.css',
})
export class BottombarComponent {
  router = inject(Router);

  navbarInfo = input.required<TUserNavInfo>();

  get enabledItems() {
    return this.navbarInfo()
      .flatMap((section) => section.items)
      .filter((item) => item.enabled);
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  navigate(route: string) {
    this.router.navigateByUrl(route);
  }
}
