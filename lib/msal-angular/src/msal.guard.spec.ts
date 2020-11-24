import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { of } from 'rxjs';
import { MsalGuardConfiguration } from './msal.guard.config';
import { MsalModule, MsalGuard, MsalService, MsalBroadcastService } from './public-api';

let guard: MsalGuard;
let authService: MsalService;
let routeMock: any = { snapshot: {} };
let routeStateMock: any = { snapshot: {}, url: '/' };
let routerMock = { navigate: jasmine.createSpy('navigate') };
let testInteractionType: InteractionType;

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
      redirectUri: 'http://localhost:4200'
    }
  });
}

function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    //@ts-ignore
    interactionType: testInteractionType
  }
}

function initializeMsal() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      MsalModule.forRoot(
        MSALInstanceFactory(),
        MSALGuardConfigFactory(),
        { interactionType: InteractionType.Popup, protectedResourceMap: new Map() }, null),
      HttpClientTestingModule
    ],
    providers: [
      MsalGuard,
      { provide: Router, useValue: routerMock },
      MsalService,
      MsalBroadcastService
    ]
  });

  authService = TestBed.inject(MsalService);
  guard = TestBed.inject(MsalGuard);
}

describe('MsalGuard', () => {
  beforeEach(() => {
    testInteractionType = InteractionType.Popup;
    initializeMsal();
  });

  it("is created", () => {
    expect(guard).toBeTruthy();
  });

  it("returns true for a logged in user", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([{
      homeAccountId: "test",
      localAccountId: "test",
      environment: "test",
      tenantId: "test",
      username: "test"
    }]);

    const listener = jasmine.createSpy();
    guard.canActivate(routeMock, routeStateMock).subscribe(listener);
    expect(listener).toHaveBeenCalledWith(true);
    done();
  });

  it("should return true after logging in with popup", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([]);

    spyOn(MsalService.prototype, "loginPopup").and.returnValue(
      //@ts-ignore
      of(true)
    );

    const listener = jasmine.createSpy();
    guard.canActivate(routeMock, routeStateMock).subscribe(listener);
    expect(listener).toHaveBeenCalledWith(true);
    done();
  });

  it("should return false after login with popup fails", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([]);

    spyOn(MsalService.prototype, "loginPopup").and.throwError("login error");

    const listener = jasmine.createSpy();
    guard.canActivate(routeMock, routeStateMock).subscribe(listener);
    expect(listener).toHaveBeenCalledWith(false);
    done();
  });

  it("should return false after logging in with redirect", (done) => {
    testInteractionType = InteractionType.Redirect;
    initializeMsal();

    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([]);

    spyOn(PublicClientApplication.prototype, "loginRedirect").and.returnValue((
      new Promise((resolve) => {
        resolve();
      })
    ));

    const listener = jasmine.createSpy();
    guard.canActivate(routeMock, routeStateMock).subscribe(listener);
    expect(listener).toHaveBeenCalledWith(false);
    done();
  });


});


