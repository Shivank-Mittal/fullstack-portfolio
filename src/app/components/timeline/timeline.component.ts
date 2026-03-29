import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, inject, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-timeline',
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css',
})
export class TimelineComponent implements OnInit, OnDestroy {
  experiences = [
    {
      title: $localize`:@@timeline.job1.title:Software and AI Systems Engineer`,
      company: 'Securigeek',
      duration: $localize`:@@timeline.job1.duration:November 2024 - November 2025`,
      description: [
        $localize`:@@timeline.job1.desc1:Built scalable Angular application with reusable components, interactive dashboards, and data visualizations using charts (E-Charts, Cytoscape) and modern UI patterns.`,
        $localize`:@@timeline.job1.desc2:Used SSR, Redux state management, lazy loading, and performance profiling.`,
        $localize`:@@timeline.job1.desc3:Implemented RAG workflows utilizing LLMs for scalable, low-latency information retrieval.`,
        $localize`:@@timeline.job1.desc4:Integrated hybrid search combining dense and sparse embeddings with Neo4j graph traversal.`
      ]
    },
    {
      title: $localize`:@@timeline.job2.title:Software Engineer (Full Stack)`,
      company: 'Murex',
      duration: $localize`:@@timeline.job2.duration:February 2022 - October 2024`,
      description: [
        $localize`:@@timeline.job2.desc1:Built and maintained portfolio manager dashboards using Angular 17 and Node JS BFF.`,
        $localize`:@@timeline.job2.desc2:Ensured seamless migration from Polymer 1 to 3, implemented unit tests with Jest.`,
        $localize`:@@timeline.job2.desc3:Developed BFF for consuming FIXatdl files and structured it for frontend.`
      ]
    },
    {
      title: $localize`:@@timeline.job3.title:Angular Developer Internship`,
      company: 'Murex',
      duration: $localize`:@@timeline.job3.duration:May 2021 - October 2021`,
      description: [
        $localize`:@@timeline.job3.desc1:Created Angular components for the UI library of Murex with Documentation.`,
        $localize`:@@timeline.job3.desc2:Wrote UI component Unit Tests ensuring high code coverage.`
      ]
    },
    {
      title: $localize`:@@timeline.job4.title:Angular Developer | Designer`,
      company: 'Scure Infosec (Freelancer)',
      duration: $localize`:@@timeline.job4.duration:April 2020 - January 2021`,
      description: [
        $localize`:@@timeline.job4.desc1:Responsible for creation of website designs and prototypes using XD and FIGMA.`,
        $localize`:@@timeline.job4.desc2:Developed frontend using Angular 8, Material Design, and Bootstrap.`
      ]
    },
    {
      title: $localize`:@@timeline.job5.title:Angular Developer`,
      company: 'SNEXT',
      duration: $localize`:@@timeline.job5.duration:March 2019 - February 2020`,
      description: [
        $localize`:@@timeline.job5.desc1:Built an intelligent web dashboard for supply chain management.`,
        $localize`:@@timeline.job5.desc2:Worked with REST APIs, Angular 7, and TypeScript.`
      ]
    },
    {
      title: $localize`:@@timeline.job6.title:SQL Developer`,
      company: 'QuickSun Technologies',
      duration: $localize`:@@timeline.job6.duration:August 2017 - February 2019`,
      description: [
        $localize`:@@timeline.job6.desc1:Developed relational database on MS Server and designed schemas.`,
        $localize`:@@timeline.job6.desc2:Used MS-Business Intelligence tools for reporting.`
      ]
    },
    {
      title: $localize`:@@timeline.job7.title:Junior Java Developer`,
      company: 'Keptbug Technologies',
      duration: $localize`:@@timeline.job7.duration:November 2015 - November 2016`,
      description: [
        $localize`:@@timeline.job7.desc1:Created backend services according to client needs.`
      ]
    }
  ];

  timelineProgress = signal(0);
  
  // Calculate vertical offset to move items up as we scroll
  // We want the timeline to move up by its total height
  verticalOffset = computed(() => {
    return -(this.timelineProgress() * 0.8); // Adjust multiplier to control speed
  });

  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', this.onScroll);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  private onScroll = () => {
    const hostElement = document.querySelector('app-carrer') as HTMLElement;
    if (!hostElement) return;

    const rect = hostElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Start animation when section hits middle, finish when section bottom hits viewport bottom
    const scrollStart = 0; 
    const distancePastTrigger = -rect.top;
    const totalDistance = rect.height - windowHeight;

    const progress = (distancePastTrigger / totalDistance) * 100;
    this.timelineProgress.set(Math.min(Math.max(progress, 0), 100));
  };

  isItemVisible(index: number): boolean {
    const threshold = (index / this.experiences.length) * 100;
    return this.timelineProgress() >= threshold - 5; // Reveal slightly early
  }

  // Calculate opacity based on position (fading at top/bottom)
  getItemOpacity(index: number): number {
    const progress = this.timelineProgress();
    const itemThreshold = (index / this.experiences.length) * 100;
    
    if (progress < itemThreshold - 10) return 0;
    if (progress > itemThreshold + 30) return 0.2; // Fade out as it goes up
    return 1;
  }
}
