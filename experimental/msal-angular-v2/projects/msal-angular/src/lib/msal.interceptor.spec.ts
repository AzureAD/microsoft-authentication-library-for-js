
import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from "@angular/common/http";
import {
  HttpClientTestingModule
} from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";


import { MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG } from './constants';
import { MsalInterceptor } from './msal.interceptor';
import { MsalService } from './msal.service';
import { MsalBroadcastService } from './msal.broadcast.service';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';


function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
      redirectUri: 'http://localhost:4200'
    }
  });
}

describe('MsalInterceptor', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        MsalInterceptor,
        MsalService,
        MsalBroadcastService,
        {
          provide: MSAL_INTERCEPTOR_CONFIG,
          useValue: undefined
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MsalInterceptor,
          multi: true,
        },
        {
          provide: MSAL_INSTANCE,
          useFactory: MSALInstanceFactory
        }
      ]
    });
    
  });

  it('should be created', () => {
    const interceptor: MsalInterceptor = TestBed.inject(MsalInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
