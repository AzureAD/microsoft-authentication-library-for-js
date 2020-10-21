import { TestBed } from '@angular/core/testing';
import { InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MsalModule, MsalGuard, MsalService, MsalBroadcastService } from '../public-api';

describe('MsalGuard', () => {
  let guard: MsalGuard;

  function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication({
      auth: {
        clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
        redirectUri: 'http://localhost:4200'
      }
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MsalModule.forRoot(MSALInstanceFactory(), null, {interactionType: InteractionType.Popup, protectedResourceMap: new Map()})
      ],
      providers: [
        MsalGuard,
        MsalService,
        MsalBroadcastService
      ]
    });

    guard = TestBed.inject(MsalGuard);
  });

});
