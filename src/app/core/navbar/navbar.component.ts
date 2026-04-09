import { Component, ElementRef, inject, input, LOCALE_ID, OnInit, output, signal, viewChildren, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { TNavbarInfo, TNavItem } from '../../types/TNavItems';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ResponsiveService } from '../../service/responsive-service/responsive.service';
import { ButtonComponent } from '../../components/button/button.component';
import { Router } from '@angular/router';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { AuthStore } from '../../store/auth/auth.store';

@Component({
  selector: 'app-navbar',
  imports: [TitleCasePipe, CommonModule, ButtonComponent, AvatarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  items = viewChildren<ElementRef>("navItem");
  navbarInfo = input.required<TNavbarInfo>()

  onItemSelection = output<TNavItem>();
  
  private readonly responseService = inject(ResponsiveService)
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly document = inject(DOCUMENT)
  private readonly localeId = inject(LOCALE_ID)

  protected readonly deviceType$ = this.responseService.deviceType$
  protected readonly avatarInfo = this.authStore.avatarInfo;
  protected readonly isLoggedIn = this.authStore.isLoggedIn;


  currentLang: 'en' | 'fr' = 'en';

  ngOnInit() {
    // Use the build-time LOCALE_ID to detect the current language reliably.
    // Angular i18n sets this at compile time for each locale build.
    this.currentLang = this.localeId.startsWith('fr') ? 'fr' : 'en';
  }

  switchLang(lang: 'en' | 'fr') {
    if (lang === this.currentLang || !isPlatformBrowser(this.platformId)) return;

    // Angular i18n produces separate builds per locale.
    // Switching locale requires navigating to the other build's base path.
    // English is served at "/" and French at "/fr/" (based on angular.json baseHref).
    const currentPath = this.document.location.pathname;
    if (lang === 'fr') {
      // Strip current base and prepend /fr/
      const pathWithoutBase = currentPath.replace(/^\//, '');
      this.document.location.href = '/fr/' + pathWithoutBase;
    } else {
      // Remove /fr/ prefix to go back to English root
      const pathWithoutFr = currentPath.replace(/^\/fr\/?/, '/');
      this.document.location.href = pathWithoutFr;
    }
  }

  // Handlers
  handleElementSection(name: TNavItem){
    // const currentNavigation = this.router.routerState.snapshot.url;
    this.onItemSelection.emit(name)

  }

  profileHandler() {
    this.router.navigateByUrl('/resume')
  }

  handleLogoClick() {
    this.router.navigateByUrl('')
  } 

  keyInteractionHandler(event: KeyboardEvent) {
    const elementId = (event?.currentTarget as HTMLElement)?.id;
    const keyDirection = this.keyDirection(event);

    if(!keyDirection) return;
    const currentIndex = this.navbarInfo().items.findIndex(item => item.id === elementId);
    const nextFocusableIndex = this.nextFocusableIndex(keyDirection, currentIndex);

    if(nextFocusableIndex === undefined) return;
    (this.items()[nextFocusableIndex].nativeElement as HTMLElement).focus()
  }


  // utilities

  /**
   * Give direction of the key : RIGHT or LEFT.
   * For other keys it return undefined
   * @param event: KeyboardEvent
   * @returns RIGHT, LEFT, Undefined
   */
  private keyDirection(event: KeyboardEvent) {
    return event.key === 'ArrowRight'
      ? 'right'
      : event.key === 'ArrowLeft' 
        ? 'left' 
        : undefined;
  }

  private nextFocusableIndex(direction: 'right' | 'left', currentIndex: number ):number | undefined{
    if(direction === 'right') {
      return currentIndex === this.navbarInfo().items.length - 1? 0 : currentIndex + 1 ;
    }
    if(direction === 'left') {
      return currentIndex === 0? this.navbarInfo().items.length - 1: currentIndex - 1;
    }
    return undefined
  }

}
