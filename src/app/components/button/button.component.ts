import { Component, input } from '@angular/core';
import { BUTTON } from '../../types/TButtons';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
})
export class ButtonComponent {

  type = input<BUTTON>(BUTTON.Default);
  size = input<'sm'| 'md' |'lg'>('sm');
}
