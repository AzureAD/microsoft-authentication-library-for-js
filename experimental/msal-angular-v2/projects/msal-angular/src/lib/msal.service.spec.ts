import { TestBed } from '@angular/core/testing';

import { MsalService } from './msal.service';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MSAL_INSTANCE } from './constants';
import { MsalBroadcastService } from './msal.broadcast.service';

let authService: MsalService;
let broadcastService: MsalBroadcastService;

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
      redirectUri: 'http://localhost:4200'
    }
  });
}

function initializeMsal() {
  TestBed.resetTestingModule();

  TestBed.configureTestingModule({ 
    providers: [
      MsalService,
      MsalBroadcastService,
      {
        provide: MSAL_INSTANCE,
        useFactory: MSALInstanceFactory
      }
    ]
  });

  authService = TestBed.inject(MsalService);
}

describe('MsalService', () => {
  // beforeEach(() => {
  // });

  beforeAll(initializeMsal);
  afterAll(() => {
      TestBed.resetTestEnvironment();
      TestBed.resetTestingModule();
      authService = null;
      broadcastService = null;
  });

  it('should be created', () => {
    expect(authService).toBeTruthy();
  });
});
