import { Component, ElementRef, input, viewChild, afterNextRender, OnDestroy, HostListener, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

@Component({
  selector: 'app-network-background',
  standalone: true,
  template: `<canvas #networkCanvas></canvas>`,
  styles: `
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
      opacity: 0.5;
    }
    canvas {
      display: block;
    }
  `
})
export class NetworkBackgroundComponent implements OnDestroy {
  // Angular Signals (v17+)
  canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('networkCanvas');
  
  nodeColor = input<string>('rgba(59, 130, 246, 0.2)'); 
  nodeCount = input<number>(60);
  connectionDistance = input<number>(180);

  private ctx: CanvasRenderingContext2D | null = null;
  private nodes: Node[] = [];
  private animationId: number = 0;
  private platformId = inject(PLATFORM_ID);

  constructor() {
    // Only run animation on the browser (not SSR)
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        const canvas = this.canvasRef()?.nativeElement;
        if (canvas) {
          this.ctx = canvas.getContext('2d');
          this.resizeCanvas();
          this.initNodes();
          this.animate();
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeCanvas();
    this.initNodes();
  }

  private resizeCanvas() {
    const canvas = this.canvasRef()?.nativeElement;
    const parent = canvas?.parentElement;
    if (canvas && parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  }

  private initNodes() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    this.nodes = Array.from({ length: this.nodeCount() }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4
    }));
  }

  private animate() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || !this.ctx) return;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

      // Draw Node
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
      this.ctx.fillStyle = this.nodeColor();
      this.ctx.fill();

      // Draw Connections
      for (let j = i + 1; j < this.nodes.length; j++) {
        const other = this.nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.connectionDistance()) {
          const opacity = 1 - (dist / this.connectionDistance());
          this.ctx.beginPath();
          this.ctx.moveTo(node.x, node.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.25})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.stroke();
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}
