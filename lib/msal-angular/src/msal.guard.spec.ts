import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { BrowserSystemOptions, BrowserUtils, InteractionType, IPublicClientApplication, LogLevel, PublicClientApplication, UrlString } from '@azure/msal-browser';
import { of } from 'rxjs';
import { MsalGuardConfiguration } from './msal.guard.config';
import { MsalModule, MsalGuard, MsalService, MsalBroadcastService } from './public-api';

let guard: MsalGuard;
let authService: MsalService;
let routeMock: any = { snapshot: {} };
let routeStateMock: any = { snapshot: {}, url: '/' };
let routerMock = { navigate: jasmine.createSpy('navigate') };
let testInteractionType: InteractionType;
let testLoginFailedRoute: string;
let testConfiguration: Partial<MsalGuardConfiguration>;
let browserSystemOptions: BrowserSystemOptions;

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
      redirectUri: 'http://localhost:4200'
    },
    //system: browserSystemOptions
  });
}

function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    //@ts-ignore
    interactionType: testInteractionType,
    loginFailedRoute: testLoginFailedRoute,
    authRequest: testConfiguration?.authRequest,
    canActivate: testConfiguration?.canActivate
  }
}

function initializeMsal() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      MsalModule.forRoot(
        MSALInstanceFactory(),
        MSALGuardConfigFactory(),
        { interactionType: InteractionType.Popup, protectedResourceMap: new Map() }),
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
    testLoginFailedRoute = undefined;
    testConfiguration = { };
    browserSystemOptions = { };
    initializeMsal();
  });

  it("is created", () => {
    expect(guard).toBeTruthy();
  });

  it("throws error for silent interaction type", (done) => {
    testInteractionType = InteractionType.Silent;
    initializeMsal();
    try {
      guard.canActivate(routeMock, routeStateMock)
      .subscribe(
        (result) => {},
      );
    } catch (err) {
      expect(err.errorCode).toBe("invalid_interaction_type");
      done();
    }
  })

  it("returns false if page with MSAL Guard is set as redirectUri", (done) => {
    spyOn(UrlString, "hashContainsKnownProperties").and.returnValue(true);
    spyOn(BrowserUtils, "isInIframe").and.returnValue(true);

    guard.canActivate(routeMock, routeStateMock)
      .subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
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

    guard.canActivate(routeMock, routeStateMock)
      .subscribe(result => {
        expect(result).toBeTrue();
        done();
      });
  });

  it("should return true after logging in with popup", (done) => {
    testConfiguration = {
      authRequest: (authService, state) => {
        expect(state).toBeDefined();
        expect(authService).toBeDefined();
        return { };
      }
    }
    initializeMsal();
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([]);

    spyOn(MsalService.prototype, "loginPopup").and.returnValue(
      //@ts-ignore
      of(true)
    );
    
    guard.canActivate(routeMock, routeStateMock)
      .subscribe(result => {
        expect(result).toBeTrue();
        done();
      });
  });

  it("should return false after login with popup fails and no loginFailedRoute set", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([]);

    spyOn(MsalService.prototype, "loginPopup").and.throwError("login error");

    guard.canActivate(routeMock, routeStateMock)
      .subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
  });

  it("should return loginFailedRoute after login with popup fails and loginFailedRoute set", (done) => {
    testLoginFailedRoute = "failed";
    initializeMsal();

    spyOn(guard, "parseUrl").and.returnValue(
      testLoginFailedRoute as unknown as UrlTree
    )

    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([]);

    spyOn(MsalService.prototype, "loginPopup").and.throwError("login error");

    guard.canActivate(routeMock, routeStateMock)
      .subscribe(result => {
        expect(result).toBe("failed" as unknown as UrlTree);
        done();
      });
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

    guard.canActivate(routeMock, routeStateMock)
        .subscribe(result => {
            expect(result).toBeFalse();
            done();
        });
  });

  it("canActivateChild returns true with logged in user", (done) => {
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

    guard.canActivateChild(routeMock, routeStateMock)
      .subscribe(result => {
        expect(result).toBeTrue();
        done();
      });
  });

  it("canActivateChild returns false with logged in user and access validator", (done) => {
    browserSystemOptions = {
      loggerOptions: {
        logLevel: LogLevel.Verbose,
        loggerCallback: (level, message) => console.log(message)
      }
    };
    testConfiguration.canActivate = (msalService, state) => {
      expect(msalService).toBeDefined();
      expect(state).toBeDefined();
      return of(false);
    }
    initializeMsal();
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

    guard.canActivateChild(routeMock, routeStateMock)
      .subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
  });

  it("canLoad returns true with logged in user", (done) => {
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

    guard.canLoad()
      .subscribe(result => {
        expect(result).toBeTrue();
        done();
      });
  });

  it("canLoad returns false with logged in user and access validator", (done) => {
    browserSystemOptions = {
      loggerOptions: {
        logLevel: LogLevel.Verbose,
        loggerCallback: (level, message) => console.log(message)
      }
    };
    testConfiguration.canActivate = (msalService, state) => {
      expect(msalService).toBeDefined();
      expect(state).toBeUndefined();
      return false;
    }
    initializeMsal();
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

    

    guard.canLoad()
      .subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
  });

  it("canLoad returns false with no users logged in", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([]);

    guard.canLoad()
      .subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
  });

});


