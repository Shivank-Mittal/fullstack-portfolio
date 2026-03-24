import { Component, ElementRef, inject, input, OnInit, output, viewChildren } from '@angular/core';
import { single } from 'rxjs';
import { TNavbarInfo, TNavItem } from '../../types/TNavItems';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ResponsiveService } from '../../service/responsive-service/responsive.service';
import { SuperBaseService } from '../../service/superbase-service/superbase.service';
import { ButtonComponent } from '../../components/button/button.component';

@Component({
  selector: 'app-navbar',
  imports: [TitleCasePipe, CommonModule, ButtonComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {

  items = viewChildren<ElementRef>("navItem");

  navbarInfo = input.required<TNavbarInfo>()
  onItemSelection = output<TNavItem>();

  responseService = inject(ResponsiveService)
  dbClient = inject(SuperBaseService)
  deviceType$ = this.responseService.deviceType$

  resumeName = 'Resume_EN';


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

  onResumeDownload() {
    this.dbClient.getResume(this.resumeName).then((response) => {

    debugger

    const url = URL.createObjectURL(response.data.data);
    const link = document.createElement('a');
    link.href = url; // Use the URL directly
    link.setAttribute('download', 'Shivank_Mittal_Resume.pdf'); // Set the file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    }).catch((error) => {
      console.error('Error downloading resume:', error);
    });
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
