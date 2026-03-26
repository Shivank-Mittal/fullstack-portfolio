import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/navbar/navbar.component';
import { TNavbarInfo, TNavItem } from './types/TNavItems';
import { ResponsiveService } from './service/responsive-service/responsive.service';
import { AboutComponent } from "./features/about/about.component";
import { TechDepthComponent } from './features/tech-depth/tech-depth.component';
import { CarrerComponent } from './features/carrer/carrer.component';
import { ContactComponent } from './features/contact/contact.component';
import { FooterComponent } from './core/footer/footer.component';
import { HomeComponent } from './page/home/home.component';
import { ToasterComponent } from './components/toaster/toaster.component';
import { AuthService } from './service/auth-service/auth.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, TitleCasePipe, NavbarComponent, CommonModule, HomeComponent, FooterComponent, ToasterComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{

  responseService = inject(ResponsiveService);
  authClient = inject(AuthService)

  deviceType$ = this.responseService.deviceType$;
  title = signal('porfolio');
  navItem = signal<string>('')
  navbarInfo = signal<TNavbarInfo>({
    name: "Shivank Mittal",
    avatar: {
      alt: "Shivank Mittal",
      size: "md",
      loggedIn: true
    },
    items: [
      {name: "about", id: "about", route: "about", component: AboutComponent},
      {name: "tech", id: "tech", route: "tech-depth", component: TechDepthComponent},
      {name: "carrier timeline", id: "carrier-timeline", route: "carrer", component: CarrerComponent},
      {name: "contact", id: "contact", route: "contact",  component: ContactComponent},
    ]
  })


  // handlers
  navigationHandler(navItem: TNavItem) {
    this.navItem.set(navItem.id)
  }

  ngOnInit(): void {
      this.authClient.verifyLogin()
  }
}
