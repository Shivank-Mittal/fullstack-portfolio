import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { BUTTON } from '../../types/TButtons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [ButtonComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {

  private readonly router = inject(Router);

  viewButtonType = BUTTON.OUTLINE


  // handlers
  handleContactUs() {
    this.router.navigateByUrl('/contact')
  }

}
