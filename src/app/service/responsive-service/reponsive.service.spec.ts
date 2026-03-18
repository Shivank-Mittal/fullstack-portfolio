import { TestBed } from '@angular/core/testing';

import { ReponsiveService } from './responsive.service';

describe('ReponsiveService', () => {
  let service: ReponsiveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReponsiveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
