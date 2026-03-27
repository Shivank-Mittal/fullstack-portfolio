import { Component, signal, computed, afterNextRender, inject } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { BUTTON } from '../../types/TButtons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBrain, faBriefcase, faGaugeHigh, faCode, faTerminal, faMicrochip } from '@fortawesome/free-solid-svg-icons';
import { NetworkBackgroundComponent } from '../../components/network-background/network-background.component';
import { Router } from '@angular/router';
import { SuperBaseService } from '../../service/superbase-service/superbase.service';

@Component({
  selector: 'app-hero',
  imports: [ButtonComponent, FontAwesomeModule, NetworkBackgroundComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {

  getInTouchButton = BUTTON.OUTLINE;

  router = inject(Router)
  private readonly dbClient = inject(SuperBaseService)
  resumeName = 'Resume_Shivank_MITTAL.pdf';

  readonly icons = {
    briefcase: faBriefcase,
    projectDiagram: faBrain,
    user: faGaugeHigh,
    code: faCode,
    brain: faBrain,
    terminal: faTerminal,
    microchip: faMicrochip
  };

  private readonly writingSpeed = 45; // ms per character

  // Typing logic
  private readonly fullLines = [
    'Engineering intelligent',
    'frontend systems',
    'powered by',
    'scalable AI architectures'
  ];

  private readonly currentCharIndex = signal(0);
  typingComplete = signal(false);

  line1 = computed(() => this.getVisibleText(0));
  line2 = computed(() => this.getVisibleText(1));
  line3 = computed(() => this.getVisibleText(2));
  line4 = computed(() => this.getVisibleText(3));

  constructor() {
    afterNextRender(() => {
      this.startTyping();
    });
  }

  // handlers
  getIntTouchHandler() {
    this.router.navigateByUrl('/contact')
  }

  onResumeDownload() {
    this.dbClient.getResume(this.resumeName).then((response) => {

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

  private getVisibleText(lineIdx: number): string {
    const currentIndex = this.currentCharIndex();
    let charsBeforeThisLine = 0;
    for (let i = 0; i < lineIdx; i++) {
      charsBeforeThisLine += this.fullLines[i].length;
    }

    const visibleCharsInThisLine = Math.max(0, currentIndex - charsBeforeThisLine);
    return this.fullLines[lineIdx].substring(0, visibleCharsInThisLine);
  }

  private startTyping() {
    const totalChars = this.fullLines.reduce((acc, line) => acc + line.length, 0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      this.currentCharIndex.set(current);

      if (current >= totalChars) {
        clearInterval(interval);
        this.typingComplete.set(true);
      }
    }, this.writingSpeed); // Speed of typing
  }
}
