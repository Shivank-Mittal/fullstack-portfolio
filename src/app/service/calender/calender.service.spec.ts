import { supabaseMock } from '../../../testing/supabase-mock';
import { TestBed } from '@angular/core/testing';
import { CalenderService } from './calender.service';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { provideHttpClient } from '@angular/common/http';

describe('CalenderService', () => {
  let service: CalenderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), { provide: SUPERBASE_CLIENT, useValue: supabaseMock }],
    });
    service = TestBed.inject(CalenderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
