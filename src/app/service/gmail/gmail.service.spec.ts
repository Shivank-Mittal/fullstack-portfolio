import { supabaseMock } from '../../../testing/supabase-mock';
import { TestBed } from '@angular/core/testing';
import { GmailService } from './gmail.service';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { provideHttpClient } from '@angular/common/http';

describe('GmailService', () => {
  let service: GmailService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), { provide: SUPERBASE_CLIENT, useValue: supabaseMock }],
    });
    service = TestBed.inject(GmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
