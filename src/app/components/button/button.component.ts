import { Component, input } from '@angular/core';
import { BUTTON } from '../../types/TButtons';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
})
export class ButtonComponent {
  disabled = input(false);

  /** Visual variant (maps to `.btn-*` classes) */
  type = input<BUTTON>(BUTTON.Default);
  size = input<'sm'| 'md' |'lg'>('sm');

  /**
   * Native `<button type="...">`. Default `button` avoids accidental form submits.
   * Use `submit` when the control should submit a parent `<form>`.
   * (Avoid names like `nativeButtonType` — they can collide with runtime/DOM and break signal `()` calls.)
   */
  htmlType = input<'submit' | 'button' | 'reset'>('button');
}
