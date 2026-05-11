import { Component, HostListener, inject, input, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { TUserNavInfo, TUserNavItem } from '../../types/TUserNavItems';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-topbar',
  imports: [FaIconComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private readonly router = inject(Router);

  navbarInfo = input.required<TUserNavInfo>();

  protected readonly open = signal(false);
  protected readonly chevronIcon = faChevronDown;

  private readonly routeUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  get activeItem(): TUserNavItem | undefined {
    const url = this.routeUrl();
    return this.navbarInfo()
      .flatMap((s) => s.items)
      .find((item) => url === item.router || url.startsWith(item.router + '/'));
  }

  toggle() {
    this.open.update((v) => !v);
  }

  navigate(route: string, enabled: boolean) {
    if (!enabled) return;
    this.open.set(false);
    this.router.navigateByUrl(route);
  }

  isActive(route: string): boolean {
    const url = this.routeUrl();
    return url === route || url.startsWith(route + '/');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const host = (event.target as HTMLElement).closest('app-topbar');
    if (!host) this.open.set(false);
  }
}
