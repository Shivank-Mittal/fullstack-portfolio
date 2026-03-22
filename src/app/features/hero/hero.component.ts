import { Component } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { BUTTON } from '../../types/TButtons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBrain, faBriefcase, faGaugeHigh, faGuaraniSign, faProjectDiagram, faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-hero',
  imports: [ButtonComponent, FontAwesomeModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  
  getInTouchButton = BUTTON.OUTLINE

  icons = {
    briefcase:  faBriefcase,
    projectDiagram: faBrain,
    user: faGaugeHigh
  }

}
