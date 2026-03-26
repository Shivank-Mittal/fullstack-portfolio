import { Component, ElementRef, inject, input, OnInit, output, signal, viewChildren } from '@angular/core';
import { map, Observable, single } from 'rxjs';
import { TNavbarInfo, TNavItem } from '../../types/TNavItems';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ResponsiveService } from '../../service/responsive-service/responsive.service';
import { ButtonComponent } from '../../components/button/button.component';
import { Router } from '@angular/router';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { AuthService } from '../../service/auth-service/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [TitleCasePipe, CommonModule, ButtonComponent, AvatarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  items = viewChildren<ElementRef>("navItem");
  navbarInfo = input.required<TNavbarInfo>()

  onItemSelection = output<TNavItem>();
  
  private readonly responseService = inject(ResponsiveService)
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router)


  protected readonly deviceType$ = this.responseService.deviceType$
  protected readonly auth$ = this.authService.auth$;
  
  
  avatarInfo$= this.auth$.pipe(
    map(auth => {
      if(auth.loggedIn) {
        return {
          loggedIn: true,
          src: auth.user?.user_metadata?.avatar_url || '',
          alt: auth.user?.user_metadata?.full_name || 'User Avatar',
          name: auth.user?.user_metadata?.full_name || 'User',
          size: 'md'
        }
      }
      else {
        return {
          loggedIn: false,
          alt: '',
          name: '',
          size: 'md'
        }
      }
    })
  )


  // Handlers
  handleElementSection(name: TNavItem){
    // const currentNavigation = this.router.routerState.snapshot.url;
    this.onItemSelection.emit(name)

  }

  loginHandler(value: 'login' | 'logout') {
    if(value === 'login') {
      this.authService.signInWithGoogle();
    }
    else {
      this.authService.signOut();

    }
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
