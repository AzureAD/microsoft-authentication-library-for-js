import { TestBed } from '@angular/core/testing';
import { InteractionType, MSAL_GUARD_CONFIG, MSAL_INSTANCE } from './constants';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MsalGuard } from './msal.guard';
import { MsalService } from './msal.service';
import { MsalBroadcastService } from './msal.broadcast.service';

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
      providers: [
        MsalGuard,
        MsalService,
        MsalBroadcastService,
        {
          provide: MSAL_GUARD_CONFIG,
          useValue: {
            interactionType: InteractionType.POPUP
          }
        },
        {
          provide: MSAL_INSTANCE,
          useFactory: MSALInstanceFactory
        }
      ]
    });

    guard = TestBed.inject(MsalGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
