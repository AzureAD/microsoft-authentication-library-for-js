import { APP_INITIALIZER } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { MsalBroadcastService } from './msal.broadcast.service';
import { msalInitFactory } from './msal.init.factory';
import { MsalModule, MsalService } from './public-api';

let handleRedirectPromiseSpy: jasmine.Spy;
let inProgressSubscribeSpy: jasmine.Spy;

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
    redirectUri: 'http://localhost:4200'
  }
});

describe('msalInitFactory', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();

    const sampleAccessToken = {
      accessToken: "123abc"
    };

    handleRedirectPromiseSpy = spyOn(PublicClientApplication.prototype, "handleRedirectPromise").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve(sampleAccessToken);
      })
    ));

    inProgressSubscribeSpy = spyOn(MsalBroadcastService.prototype.inProgress$, "subscribe").and.callThrough();

    TestBed.configureTestingModule({
      imports: [
        MsalModule.forRoot(msalInstance, null, {interactionType: InteractionType.Popup, protectedResourceMap: new Map()})
      ],
      providers: [
        {
          provide: APP_INITIALIZER,
          useFactory: msalInitFactory,
          deps: [
              MsalService,
              MsalBroadcastService
          ],
          multi: true
        },
      ]
    });
  });

  it("should execute msalInitFactory on APP_INITIALIZER", (done) => {
    expect(handleRedirectPromiseSpy).toHaveBeenCalledTimes(1);
    expect(inProgressSubscribeSpy).toHaveBeenCalledTimes(1);
  });

});
