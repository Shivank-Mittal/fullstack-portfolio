import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/navbar/navbar.component';
import { TNavbarInfo, TNavItem } from './types/TNavItems';
import { ResponsiveService } from './service/responsive-service/responsive.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, TitleCasePipe, NavbarComponent, CommonModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {

  responseService = inject(ResponsiveService);

  deviceType$ = this.responseService.deviceType$;

  title = signal('porfolio');

  navbarInfo = signal<TNavbarInfo>({
    name: "Shivank Mittal",
    items: [
      {name: "about", id: "about", route: "about"},
      {name: "skills", id: "skills", route: "skills"},
      {name: "projects", id: "projects", route: "projects"},
      {name: "Contact", id: "Contact", route: "Contact"},
    ]
  })


  // handlers


  navigationHandler(navItem: TNavItem) {
    console.log(navItem)
  }
}
