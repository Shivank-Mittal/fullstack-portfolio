import { Component, ElementRef, inject, input, OnInit, output, viewChildren } from '@angular/core';
import { single } from 'rxjs';
import { TNavbarInfo, TNavItem } from '../../types/TNavItems';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ResponsiveService } from '../../service/responsive-service/responsive.service';

@Component({
  selector: 'app-navbar',
  imports: [TitleCasePipe, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {

  items = viewChildren<ElementRef>("navItem");

  navbarInfo = input.required<TNavbarInfo>()
  onItemSelection = output<TNavItem>();

  responseService = inject(ResponsiveService)
  deviceType$ = this.responseService.deviceType$


  // Handlers
  handleElementSection(name: TNavItem){
    this.onItemSelection.emit(name)
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
