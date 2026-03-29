import { Component, effect, ElementRef, input, untracked, viewChild } from '@angular/core';
import { AboutComponent } from '../../features/about/about.component';
import { CommonModule } from '@angular/common';
import { CarrerComponent } from '../../features/carrer/carrer.component';
import { HeroComponent } from '../../features/hero/hero.component';
import { TechDepthComponent } from '../../features/tech-depth/tech-depth.component';
import { ContactComponent } from '../../features/contact/contact.component';

@Component({
  selector: 'app-home',
  imports: [ CommonModule , HeroComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  host: {
    'id': 'home'
  }
})
export class HomeComponent {

  focus = input<string>();
  informationSection = viewChild<ElementRef>("information");

  items = [
        {name: "about", id: "about", route: "about", component: AboutComponent},
        {name: "tech", id: "tech", route: "tech-depth", component: TechDepthComponent},
        {name: "carrier timeline", id: "carrier-timeline", route: "carrer", component: CarrerComponent},
        {name: "contact", id: "contact", route: "contact",  component: ContactComponent},
      ]


  constructor() {
    effect(() => {
      const focusAsId = this.focus();
      const informationSection = untracked(this.informationSection);
      if(!informationSection || !focusAsId) return;

      const informationSectionElement = informationSection.nativeElement;
      informationSectionElement.children.namedItem(focusAsId).scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"})
    })
  }
}
