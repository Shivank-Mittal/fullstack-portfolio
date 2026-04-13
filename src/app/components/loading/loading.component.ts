import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  imports: [],
  template: `
    <div class="loading-bar" [class.active]="loading()">
      <div class="loading-bar-progress"></div>
    </div>
  `,
  styles: `
    .loading-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 10;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }

    .loading-bar.active {
      opacity: 1;
    }

    .loading-bar-progress {
      width: 40%;
      height: 100%;
      background: var(--gradient-primary, linear-gradient(90deg, #6366f1, #818cf8));
      border-radius: 0 2px 2px 0;
      animation: slide 1.2s ease-in-out infinite;
    }

    @keyframes slide {
      0%   { transform: translateX(-100%); }
      50%  { transform: translateX(200%); }
      100% { transform: translateX(-100%); }
    }
  `,
})
export class LoadingComponent {
  loading = input(false);
}
