import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  src = input();
  alt = input();
  name = input();
  size = input<'sm' | 'md' | 'lg'>('md');
  loggedIn = input<boolean>(false);

  imageLoadFailed = false;

  initials = computed(() => {
    const isLoggedIn = this.loggedIn();
    if (!isLoggedIn) return '';

    const resolvedName = (this.name() as string).trim();
    if (!resolvedName) return 'SM';

    const parts = resolvedName.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
  });

  onImageError() {
    this.imageLoadFailed = true;
  }

  get showImage() {
    return this.loggedIn() && !!this.src() && !this.imageLoadFailed;
  }
}
