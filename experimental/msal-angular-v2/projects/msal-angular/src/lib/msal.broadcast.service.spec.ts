import { TestBed } from '@angular/core/testing';
import { MsalBroadcastService } from './msal.broadcast.service';

describe('MsalBroadcastService', () => {
  let broadcastService: MsalBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MsalBroadcastService]
    });
    broadcastService = TestBed.inject(MsalBroadcastService);
  });

  it('should be created', () => {
    expect(broadcastService).toBeTruthy();
  });
});
