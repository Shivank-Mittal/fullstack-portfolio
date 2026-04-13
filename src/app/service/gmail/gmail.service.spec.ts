import { TestBed } from '@angular/core/testing';

import { GmailService } from './gmail.service';

describe('GmailService', () => {
  let service: GmailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
