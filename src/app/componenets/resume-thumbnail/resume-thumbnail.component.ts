import { ChangeDetectorRef, Component, ElementRef, inject, input, NgZone, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { TThumbnailState } from '../../types/TThumbnailState';
import { PdfJSFacade } from '../../../pdf/resume/pdf.facade';

@Component({
  selector: 'app-resume-thumbnail',
  imports: [],
  templateUrl: './resume-thumbnail.component.html',
  styleUrl: './resume-thumbnail.component.css',
})
export class ResumeThumbnailComponent implements OnInit, OnDestroy {
  canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('pdfCanvas')

  pdfUrl= input<string>();
  alt = input('Resume preview');
  pdfScale = input(1.5);

  private ngZone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>)
  private readonly cdr = inject(ChangeDetectorRef)
  private readonly pdfJS = inject(PdfJSFacade);
  
  protected state = signal<TThumbnailState>('skeleton');
  private readonly validTransitions: Record<TThumbnailState, TThumbnailState[]> = {
    skeleton: ['loading'],
    loading:  ['loaded', 'error'],
    loaded:   [],
    error:    [],
  };
 
  private readonly pdfRenderPageNumber = 1;
 
  private observer?: IntersectionObserver;
  private rendered = false;
 
  ngOnInit(): void {
    this.setupLazyRender();
  }
 
  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private transition(next: TThumbnailState): void {
    const current = this.state();
    if (!this.validTransitions[current].includes(next)) {
      console.warn(`Invalid state transition: ${current} → ${next}`);
      return;
    }
    this.state.set(next);
  }

  // ── PDF.js lazy render ────────────────────────────────────────────────────────
 
  private setupLazyRender(): void {
    if (this.observer) return;
    
    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !this.rendered) {
            this.rendered = true;
            this.observer?.disconnect();
            this.renderPdf();  // now runs outside zone too
          }
        },
        { rootMargin: '200px 0px' },
      );
      this.observer.observe(this.host.nativeElement);
    });
  }
 
  private async renderPdf(): Promise<void> {
    if (!this.pdfUrl()) return;

    this.ngZone.run(() => this.transition('loading'));
    try {
      await this.pdfJS.renderPageToCanvas(
          this.pdfUrl()!, 
          this.pdfRenderPageNumber, 
          this.pdfScale(), 
          this.canvasRef().nativeElement
      )

      this.ngZone.run(() => {
        this.transition('loaded');
        this.cdr.markForCheck();
      });
    } catch (err) {
      console.error('FAILED AT STEP — full error:', err);
      this.ngZone.run(() => {
        this.transition('error');
        this.cdr.markForCheck();
      });
    }
  }
}
