import { ApplicationInitStatus, APP_INITIALIZER } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalInitFactory } from './msal.init.factory';
import { MsalModule, MsalService, MsalBroadcastService } from './public-api';

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
    redirectUri: 'http://localhost:4200'
  }
});

fdescribe('msalInitFactory', () => {
  let inProgressSubscribeSpy: jasmine.Spy;
  let handleRedirectObservableSpy: jasmine.Spy;

  it("should execute msalInitFactory on APP_INITIALIZER", async () => {
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      imports: [
        MsalModule.forRoot(msalInstance, null, null)
      ],
      providers: [
        {
          provide: APP_INITIALIZER,
          useFactory: (
            authService: MsalService,
            msalBroadcastService: MsalBroadcastService
          ) => {
            inProgressSubscribeSpy = spyOn(msalBroadcastService.inProgress$, "subscribe").and.callThrough();
            handleRedirectObservableSpy = spyOn(authService, "handleRedirectObservable").and.callThrough();

            return msalInitFactory(authService, msalBroadcastService);
          },
          deps: [
            MsalService,
            MsalBroadcastService
          ],
          multi: true
        },
      ]
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(handleRedirectObservableSpy).toHaveBeenCalled();
    expect(inProgressSubscribeSpy).toHaveBeenCalled();
  });

});
