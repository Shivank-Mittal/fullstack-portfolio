import {
  TAppleCalendarEvent,
  TCalendarEvent,
  TGoogleCalendarEvent,
} from '../../types/TCalendar';

export function mapGoogleEvent(event: TGoogleCalendarEvent): TCalendarEvent {
  const cancelled = event.status === 'cancelled';
  return {
    title: cancelled ? `[Cancelled] ${event.summary}` : event.summary,
    start: event.start.dateTime || event.start.date || '',
    end: event.end.dateTime || event.end.date || '',
    description: event.description || '',
    location: event.location || '',
    source: 'google',
    cancelled,
    htmlLink: event.htmlLink,
  };
}

export function mapAppleEvent(event: TAppleCalendarEvent): TCalendarEvent {
  return {
    title: event.summary,
    start: event.start,
    end: event.end,
    description: event.description || '',
    location: event.location || '',
    source: 'apple',
    cancelled: false,
  };
}
