import { Component, ElementRef, ViewChildren, QueryList, afterNextRender } from '@angular/core';
import { CardComponent } from '../../components/card/card.component';
import {
  faCode,
  faCubesStacked,
  faBoltLightning,
  faBoxesStacked,
} from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CodeViewComponent } from '../../components/code-view/code-view.component';

@Component({
  selector: 'app-about',
  imports: [CardComponent, FaIconComponent, CodeViewComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {
  @ViewChildren('animatedPara') paras!: QueryList<ElementRef>;

  icons = {
    code: faCode,
    cubeStack: faCubesStacked,
    lightning: faBoltLightning,
    boxStack: faBoxesStacked,
  };

  cards = [
    {
      header: ` Clean Architecture `,
      content: ` Systems-first thinking with composable, testable abstractions`,
    },
    {
      header: ` Scalable Systems `,
      content: ` Designed platforms serving millions with sub-second latency`,
    },
    {
      header: ` Performance Obsessed `,
      content: ` Optimized Core Web Vitals across enterprise applications`,
    },
    {
      header: ` Full Stack Reach `,
      content: ` From database schemas to pixel-perfect interfaces`,
    },
  ];

  constructor() {
    afterNextRender(() => {
      this.initScrollAnimations();
    });
  }

  private initScrollAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
          }
        });
      },
      { threshold: 0.1 },
    );

    this.paras.forEach((para) => {
      observer.observe(para.nativeElement);
    });
  }
}
