import { Component, computed, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faVideo } from '@fortawesome/free-solid-svg-icons';
import { TCalendarEvent } from '../../../types/TCalendar';

const URL_REGEX = /https?:\/\/[^\s,]+/g;

@Component({
  selector: 'app-calender-event-card',
  imports: [FontAwesomeModule],
  templateUrl: './calender-event-card.component.html',
  styleUrl: './calender-event-card.component.css',
})
export class CalenderEventCardComponent {
  event = input.required<TCalendarEvent>();
  readonly faVideo = faVideo;

  /** First URL found in location or description — used as the meeting join link. */
  meetingLink = computed<string | null>(() => {
    const { location, description } = this.event();
    const text = [location, description].filter(Boolean).join(' ');
    const match = text.match(URL_REGEX);
    return match ? match[0] : null;
  });

  formatTime(isoString: string): string {
    if (!isoString || !isoString.includes('T')) return 'All day';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}
