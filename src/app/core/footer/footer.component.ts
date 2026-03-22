import { Component } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { BUTTON } from '../../types/TButtons';

@Component({
  selector: 'app-footer',
  imports: [ButtonComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {

  viewButtonType = BUTTON.OUTLINE

}
