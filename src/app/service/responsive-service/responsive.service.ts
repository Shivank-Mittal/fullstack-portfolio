import { inject, Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/internal/operators/map';
import { shareReplay } from 'rxjs/internal/operators/shareReplay';

@Injectable({
  providedIn: 'root',
})
export class ResponsiveService {
  private breakpointObserver = inject(BreakpointObserver);
  
  deviceType$ = this.breakpointObserver.observe([
  '(max-width: 767px)',
  '(min-width: 768px) and (max-width: 1023px)'
]).pipe(
  map(result => {
    if (result.breakpoints['(max-width: 767px)']) return 'mobile';
    if (result.breakpoints['(min-width: 768px) and (max-width: 1023px)']) return 'tablet';
    return 'desktop';
  }),
  shareReplay({ bufferSize: 1, refCount: true })
);
}
