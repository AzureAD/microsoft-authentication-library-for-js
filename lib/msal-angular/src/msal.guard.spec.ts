import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { Location } from "@angular/common";
import { BrowserSystemOptions, BrowserUtils, InteractionType, IPublicClientApplication, LogLevel, PublicClientApplication, UrlString } from '@azure/msal-browser';
import { of } from 'rxjs';
import { MsalGuardConfiguration } from './msal.guard.config';
import { MsalModule, MsalGuard, MsalService, MsalBroadcastService } from './public-api';
import { RouterTestingModule } from '@angular/router/testing';

let guard: MsalGuard;
let authService: MsalService;
let routeMock: any = { snapshot: {} };
let routeStateMock: any = { snapshot: {}, url: '/' };
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
    system: {
        loggerOptions: {
            loggerCallback: (level, message) => {
                // console.log(message)
            },
            logLevel: LogLevel.Verbose,
            piiLoggingEnabled: true
        }
    }
  });
}

function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    //@ts-ignore
    interactionType: testInteractionType,
    loginFailedRoute: testLoginFailedRoute,
    authRequest: testConfiguration?.authRequest,
  }
}

function initializeMsal(providers: any[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      MsalModule.forRoot(
        MSALInstanceFactory(),
        MSALGuardConfigFactory(),
        { interactionType: InteractionType.Popup, protectedResourceMap: new Map() }),
      HttpClientTestingModule,
      RouterTestingModule.withRoutes([])
    ],
    providers: [
      MsalGuard,
      MsalService,
      MsalBroadcastService,
      ...providers
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

  it("returns false if page contains known successful response (path routing)", (done) => {
    initializeMsal([
        {
            provide: Location,
            useValue: {
                path: jasmine.createSpy("path").and.callFake((hash: boolean) => hash ? "/path#code=": "/path")
            }
        }
    ])

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
        .subscribe((result: UrlTree) => {
            expect(result.toString()).toEqual('/path');
            done();
        });
  });

  it("returns false if page contains known successful response (hash routing)", (done) => {
    initializeMsal([
        {
            provide: Location,
            useValue: {
                path: jasmine.createSpy("path").and.callFake((hash: boolean) => hash ? "/code=": "/")
            }
        }
    ])

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
        .subscribe((result: UrlTree) => {
            expect(result.toString()).toEqual('/');
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


