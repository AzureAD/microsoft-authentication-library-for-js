import { TestBed } from '@angular/core/testing';

import { MsalService } from './msal.service';

describe('MsalService', () => {
  let service: MsalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MsalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
