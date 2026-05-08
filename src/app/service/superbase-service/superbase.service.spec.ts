import { supabaseMock } from '../../../testing/supabase-mock';
import { TestBed } from '@angular/core/testing';
import { SuperBaseService } from './superbase.service';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { provideHttpClient } from '@angular/common/http';

describe('SuperBaseService', () => {
  let service: SuperBaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), { provide: SUPERBASE_CLIENT, useValue: supabaseMock }],
    });
    service = TestBed.inject(SuperBaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
