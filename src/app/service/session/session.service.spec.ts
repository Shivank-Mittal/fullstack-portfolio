import { supabaseMock } from '../../../testing/supabase-mock';
import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: SUPERBASE_CLIENT, useValue: supabaseMock }],
    });
    service = TestBed.inject(SessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
