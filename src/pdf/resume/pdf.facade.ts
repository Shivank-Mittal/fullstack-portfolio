import { Injectable } from "@angular/core";
import { getDocument, GlobalWorkerOptions, PageViewport, PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";


@Injectable({ providedIn: 'root' })
export class PdfJSFacade {

    private workerInitialized = false;

    // ── Full pipeline ────────────────────────────────
    async renderPageToCanvas( url: string, pageNumber: number, scale: number, canvas: HTMLCanvasElement): Promise<void> {
        this.initWorker();
    
        const pdf = await this.loadDocument(url);
        try {
            const page = await this.getPage(pdf, pageNumber);
            await this.renderToCanvas(page, canvas, scale);
        } finally {
            this.destroyDocument(pdf); 
        }
    }

    // ── Working tasks ────────────────────────────────
    private initWorker(): void {
        if (this.workerInitialized) return;
    
        GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
        ).toString();
    
        this.workerInitialized = true;
    }

    private async loadDocument(url: string): Promise<PDFDocumentProxy> {
        const loadingTask = getDocument({ url, withCredentials: false });
        return loadingTask.promise;
    }
    
    private async getPage(pdf: PDFDocumentProxy, pageNumber: number): Promise<PDFPageProxy> {
        const clamped = this.clampPageNumber(pageNumber, pdf.numPages);
        return pdf.getPage(clamped);
    }
    
    private async renderToCanvas(page: PDFPageProxy, canvas: HTMLCanvasElement, scale: number): Promise<void> {
        const viewport = page.getViewport({ scale });
        const ctx = this.getContext(canvas, viewport);
        await page.render({ canvasContext: ctx, viewport }).promise;
    }
    
    private destroyDocument(pdf: PDFDocumentProxy): void {
        pdf.destroy();
    }

    private clampPageNumber(pageNumber: number, totalPages: number): number {
        if (pageNumber < 1) {
            console.warn(`Page number ${pageNumber} is less than 1. Clamping to 1.`);
            return 1;
        }
        if (pageNumber > totalPages) {
            console.warn(`Page number ${pageNumber} exceeds total pages ${totalPages}. Clamping to last page.`);
            return totalPages;
        }
        return pageNumber;
    }
 
    private getContext(canvas: HTMLCanvasElement, viewport: PageViewport): CanvasRenderingContext2D {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
    
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2d context from canvas');
    
        return ctx;
    }
    
}