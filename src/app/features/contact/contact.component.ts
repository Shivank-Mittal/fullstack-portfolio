import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-contact',
  imports: [FontAwesomeModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {

  icons= [
    { iconName: faMessage, value: 'mittal.shivank@gmail.com', type: 'string'},
    { iconName: faLinkedinIn, value: 'https://www.linkedin.com/in/shivank-mittal-09055ba3/', type: 'link'},
    { iconName: faGithub, value: 'https://github.com/Shivank-Mittal', type: 'link'}
  ]
}
