import { TestBed } from '@angular/core/testing';

import { MsalBroadcastService } from './msal.broadcast.service';

describe('MsalBroadcastService', () => {
  let service: MsalBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MsalBroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
