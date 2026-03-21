import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, OnDestroy, OnInit, viewChild } from '@angular/core';

@Component({
  selector: 'app-timeline',
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css',
})
export class TimelineComponent{

  experiences = [
    { title: 'Software Engineer',
      company: 'Tech Company',
      duration: 'Jan 2020 - Present',
      description: 'Working on developing and maintaining web applications using Angular and Node.js.'
    },{
      title: 'Frontend Developer',
      company: 'Creative Agency',
      duration: 'Jun 2018 - Dec 2019',
      description: 'Focused on building responsive and user-friendly interfaces using HTML, CSS, and JavaScript.'
    },{
      title: 'Intern',
      company: 'Startup Inc.',
      duration: 'Jan 2018 - May 2018',
      description: 'Assisted in the development of a mobile app using React Native and contributed to UI/UX design.'
    },{
      title: 'Freelance Web Developer',
      company: 'Self-employed',
      duration: '2016 - 2017',
      description: 'Worked on various freelance projects, creating websites and web applications for small businesses and individuals.'
    }, 
    {      title: 'Computer Science Student',
      company: 'University of Technology',
      duration: '2014 - 2018',
      description: 'Studied computer science, focusing on software development, algorithms, and data structures. Participated in coding competitions and contributed to open-source projects.'
    }
  ]

  timeline = viewChild<ElementRef>('timeline')
  timelineProgress = 0;


  constructor() {
    const offset = 100;
      effect(()=> {
        const timelineEl = this.timeline();
        if(!timelineEl) return;

        const element = timelineEl.nativeElement as HTMLElement;
        window!.addEventListener('scroll', () => {
          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const timelineTop = rect.top;
          const timelineHeight = rect.height;

          // how much of timeline is visible
          const visible = windowHeight - timelineTop - offset;

          // convert to percentage
          const progress = (visible / timelineHeight) * 100;

          // clamp between 0 and 100
          this.timelineProgress = Math.min(Math.max(progress, 0), 100);
        })
      })
  }
  
  ngAfterViewInit() {
    const timelineEl = this.timeline();
    if(!timelineEl) return;

    const element = timelineEl.nativeElement as HTMLElement;
  }

  
  

}
