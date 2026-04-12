export type TGoogleCalendarEvent = {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  status: string;
  htmlLink?: string;
};

export type TAppleCalendarEvent = {
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  source: 'apple';
};

export type TCalendarEvent = {
  title: string;
  start: string;
  end: string;
  description: string;
  location: string;
  source: 'google' | 'apple';
  cancelled: boolean;
  htmlLink?: string;
};

export type TCalendarResponse = {
  google: TGoogleCalendarEvent[];
  apple: TAppleCalendarEvent[];
  metadata: {
    rangeUsed: { timeMin: string; timeMax: string };
    googleCount: number;
    appleCount: number;
  };
};
