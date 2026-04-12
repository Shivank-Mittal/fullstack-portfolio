import { inject, Injectable } from '@angular/core';
import { SuperBaseService } from '../superbase-service/superbase.service';
import { EFunction } from '../superbase-service/functions';
import { TCalendarEvent, TCalendarResponse } from '../../types/TCalendar';
import { mapAppleEvent, mapGoogleEvent } from './calender.mapper';

@Injectable({
  providedIn: 'root',
})
export class CalenderService {

  supabaseService = inject(SuperBaseService)

  async getCalendarData(minDate: string, maxDate: string): Promise<{ google: TCalendarEvent[]; apple: TCalendarEvent[], metadata: any }> {
    const body = {
      timeMin: minDate,
      timeMax: maxDate
    };

    const resp = await this.supabaseService.callFunctionWithHTTP(EFunction.CALENDAR, body) as TCalendarResponse;

    return {
      google: (resp.google || []).map(mapGoogleEvent),
      apple: (resp.apple || []).map(mapAppleEvent),
      metadata: resp.metadata || {}
    };
  }

}
