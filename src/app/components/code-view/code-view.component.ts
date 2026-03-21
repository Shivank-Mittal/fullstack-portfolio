import { Component, input } from '@angular/core';

@Component({
  selector: 'app-code-view',
  imports: [],
  templateUrl: './code-view.component.html',
  styleUrl: './code-view.component.css',
})
export class CodeViewComponent {
  title = input<string>('file.ts');
  code = input<string>('');
  showHeader = input<boolean>(true);
}
