import { Component, computed, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { CalenderService } from '../../service/calender/calender.service';
import { TCalendarEvent } from '../../types/TCalendar';
import { CalenderEventCardComponent } from './calender-event-card/calender-event-card.component';
import { LoadingComponent } from '../../components/loading/loading.component';
import { NutritionService } from '../../service/nutrition/nutrition.service';
import { TNutritionDay } from '../../types/TNutrition';
import { NutritionDayCardComponent } from '../nutrition/day-card/nutrition-day-card.component';

@Component({
  selector: 'app-calender',
  imports: [
    FullCalendarModule,
    CalenderEventCardComponent,
    LoadingComponent,
    NutritionDayCardComponent,
  ],
  templateUrl: './calender.component.html',
  styleUrl: './calender.component.css',
})
export class CalenderComponent {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  private readonly calenderService = inject(CalenderService);
  private readonly nutritionService = inject(NutritionService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly nutritionDays = signal<TNutritionDay[]>([]);
  protected readonly selectedNutritionDay = computed(
    () => this.nutritionDays().find((d) => d.plan_date === this.selectedDate()) ?? null,
  );

  protected readonly calenderEvents = signal<{
    google: TCalendarEvent[];
    apple: TCalendarEvent[];
    metadata: any;
  }>({ google: [], apple: [], metadata: undefined });
  protected readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  protected readonly loading = signal(false);

  protected readonly selectedDayEvents = computed(() => {
    const date = this.selectedDate();
    const { google, apple } = this.calenderEvents();
    const all = [
      ...google.map((e) => ({ ...e, source: 'google' as const })),
      ...apple.map((e) => ({ ...e, source: 'apple' as const })),
    ];
    return all
      .filter((e) => e.start.startsWith(date))
      .sort((a, b) => a.start.localeCompare(b.start));
  });

  protected readonly selectedDateLabel = computed(() => {
    const date = new Date(this.selectedDate() + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  });

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    dateClick: (arg: DateClickArg) => this.handleDateClick(arg),
    datesSet: (arg) => this.getCalendarData(arg),
    eventSources: [],
    displayEventTime: false,
  };

  constructor() {
    // Mark days that have a saved meal plan; FullCalendar renders the cells with data-date.
    effect(() => {
      const planDates = new Set(this.nutritionDays().map((d) => d.plan_date));
      this.host.nativeElement
        .querySelectorAll<HTMLElement>('.fc-daygrid-day[data-date]')
        .forEach((cell) =>
          cell.classList.toggle('fc-day-has-plan', planDates.has(cell.dataset['date'] ?? '')),
        );
    });

    effect(() => {
      const events = this.calenderEvents();
      const calendarApi = this.calendarComponent?.getApi();
      if (!calendarApi) return;
      calendarApi.removeAllEventSources();

      calendarApi.addEventSource({
        events: this.toFullCalendarEvents(events.apple),
        color: '#e05c3a',
        borderColor: '#c44a2a',
        textColor: '#ffffff',
        id: 'apple',
      });

      calendarApi.addEventSource({
        events: this.toFullCalendarEvents(events.google),
        color: '#4f8ef7',
        borderColor: '#2c6ee0',
        textColor: '#ffffff',
        id: 'google',
      });
    });
  }

  handleDateClick(arg: DateClickArg) {
    // Remove selected class from previously selected day
    document
      .querySelectorAll('.fc-day-selected')
      .forEach((el) => el.classList.remove('fc-day-selected'));
    // Add to the clicked day cell
    arg.dayEl.classList.add('fc-day-selected');
    this.selectedDate.set(arg.dateStr);
  }

  formatTime(isoString: string): string {
    if (!isoString.includes('T')) return 'All day';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  async getCalendarData(dates: any) {
    this.loadNutritionDays(dates.startStr.slice(0, 10), dates.endStr.slice(0, 10));
    this.loading.set(true);
    try {
      const { google, apple, metadata } = await this.calenderService.getCalendarData(
        dates.startStr,
        dates.endStr,
      );
      this.calenderEvents.set({ google, apple, metadata });
    } finally {
      this.loading.set(false);
    }
  }

  // Plans are extra: if they fail to load, the calendar's events still show.
  private async loadNutritionDays(from: string, to: string) {
    try {
      this.nutritionDays.set(await this.nutritionService.listDays(from, to));
    } catch {
      this.nutritionDays.set([]);
    }
  }

  private toFullCalendarEvents(events: TCalendarEvent[]) {
    return events.map((e) => ({
      title: e.title,
      start: e.start,
      end: e.end,
      classNames: e.cancelled ? ['fc-event-cancelled'] : [],
      extendedProps: {
        description: e.description,
        location: e.location,
        source: e.source,
        cancelled: e.cancelled,
        htmlLink: e.htmlLink,
      },
    }));
  }
}
