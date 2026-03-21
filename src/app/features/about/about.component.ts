import { Component } from '@angular/core';
import { CardComponent } from '../../components/card/card.component';
import { faCode, faCubesStacked, faBoltLightning, faBoxesStacked } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CodeViewComponent } from '../../components/code-view/code-view.component';

@Component({
  selector: 'app-about',
  imports: [CardComponent, FaIconComponent, CodeViewComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {

  icons = {code: faCode, cubeStack: faCubesStacked, lightning: faBoltLightning, boxStack: faBoxesStacked }

}
