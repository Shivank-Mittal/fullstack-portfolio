import { Component } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { BUTTON } from '../../types/TButtons';

@Component({
  selector: 'app-hero',
  imports: [ButtonComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  
  getInTouchButton = BUTTON.OUTLINE

}
