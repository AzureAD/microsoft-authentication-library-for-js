import {
  BrowserSystemOptions,
  InteractionType,
  PublicClientApplication,
  IPublicClientApplication,
  LogLevel,
  UrlString
} from "@azure/msal-browser";
import { MsalGuard } from "./msal.guard";
import { MsalService } from "./msal.service";
import { MsalGuardConfiguration } from "./msal.guard.config";
import { TestBed } from "@angular/core/testing";
import { MsalModule } from "./msal.module";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { MsalBroadcastService } from "./msal.broadcast.service";
import { makeRbacGuard } from "./public-api";
import {
  CanActivateChildFn,
  CanActivateFn, CanMatchFn,
  UrlTree
} from "@angular/router";
import { Observable, of } from "rxjs";
import { Location } from "@angular/common";

let guard: MsalGuard;
let rbacAdminGuard: CanActivateFn & CanActivateChildFn & CanMatchFn;
let rbacRolelessGuard: CanActivateFn & CanActivateChildFn & CanMatchFn;
let authService: MsalService;
let routeMock: any = { snapshot: {} };
let routeStateMock: any = { snapshot: {}, url: "/" };
let testInteractionType: InteractionType;
let testLoginFailedRoute: string;
let testConfiguration: Partial<MsalGuardConfiguration>;
let browserSystemOptions: BrowserSystemOptions;

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: "b5c2e510-4a17-4feb-b219-e55aa5b74144",
      redirectUri: "http://localhost:4200",
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message) => {
          // console.log(message)
        },
        logLevel: LogLevel.Verbose,
        piiLoggingEnabled: true,
      },
    },
  });
}

function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    //@ts-ignore
    interactionType: testInteractionType,
    loginFailedRoute: testLoginFailedRoute,
    authRequest: testConfiguration?.authRequest,
    rbacFailedRoute: testConfiguration.rbacFailedRoute,
  };
}

function initializeMsal(providers: any[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      MsalModule.forRoot(MSALInstanceFactory(), MSALGuardConfigFactory(), {
        interactionType: InteractionType.Popup,
        protectedResourceMap: new Map(),
      }),
      HttpClientTestingModule,
      RouterTestingModule.withRoutes([]),
    ],
    providers: [MsalGuard, MsalService, MsalBroadcastService, ...providers],
    teardown: { destroyAfterEach: false },
  });

  authService = TestBed.inject(MsalService);
  guard = TestBed.inject(MsalGuard);
  rbacAdminGuard = makeRbacGuard('admin');
  rbacRolelessGuard = makeRbacGuard();
}

function assertMaybeAsync<T>(result: T | Promise<T> | Observable<T>, expectFn: (result: T) => void) {
  if (result instanceof Promise) {
    result.then(expectFn);
  } else if (result instanceof Observable) {
    result.subscribe(expectFn);
  } else {
    expectFn(result);
  }
}

describe('RBAC Guard', () => {
  beforeEach(() => {
    testInteractionType = InteractionType.Popup;
    testLoginFailedRoute = undefined;
    testConfiguration = {};
    browserSystemOptions = {};
    routeStateMock = { snapshot: {}, url: "/" };
    initializeMsal();
  });

  it("is created", () => {
    expect(rbacAdminGuard).toBeTruthy();
  });

  it("denies access to route if user does not have role", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );
    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
        idTokenClaims: {
          roles: []
        },
      },
    ]);
    const result = TestBed.runInInjectionContext(() => rbacAdminGuard(routeMock, routeStateMock));
    if (result instanceof Boolean) {
      expect(result).toBeFalse();
      done();
    }
    if (result instanceof Promise) {
      result.then(result => {
        expect(result).toBeFalse();
        done();
      });
    }
    if (result instanceof Observable) {
      result.subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    }
  });

  it("redirects to configured route if user does not have role", (done) => {
    testConfiguration.rbacFailedRoute = "/failed";
    initializeMsal();
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );
    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
        idTokenClaims: {
          roles: []
        },
      },
    ]);

    const result = TestBed.runInInjectionContext(() => rbacAdminGuard(routeMock, routeStateMock));
    assertMaybeAsync(result, result => {
      expect(result.toString()).toBe("/failed");
      done();
    })
  });

  it("redirects to configured function route if user does not have role", (done) => {
    testConfiguration.rbacFailedRoute = (requiredRoles, claimedRoles) => `/failed/${requiredRoles[0]}`;
    initializeMsal();
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );
    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
        idTokenClaims: {
          roles: []
        },
      },
    ]);

    const result = TestBed.runInInjectionContext(() => rbacAdminGuard(routeMock, routeStateMock));
    assertMaybeAsync(result, (result) => {
      expect(result.toString()).toBe("/failed/admin");
      done();
    });
  });


  it("allows access to route if user does have role", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );
    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
        idTokenClaims: {
          roles: ["admin"]
        },
      },
    ]);
    const result = TestBed.runInInjectionContext(() => rbacAdminGuard(routeMock, routeStateMock));
    assertMaybeAsync(result, (result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("throws error for silent interaction type", (done) => {
    testInteractionType = InteractionType.Silent;
    initializeMsal();
    try {
      const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));
      assertMaybeAsync(result, (result) => {})
    } catch (err) {
      expect(err.errorCode).toBe("invalid_interaction_type");
      done();
    }
  });

  it("returns false if page with MSAL Guard is set as redirectUri", (done) => {
    spyOn(UrlString, "hashContainsKnownProperties").and.returnValue(true);
    spyOnProperty(window, "parent", "get").and.returnValue({ ...window });

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));
    assertMaybeAsync(result, (result) => {
      expect(result).toBeFalse();
      done();
    });
  });

  it("returns false if page contains known successful response (path routing)", (done) => {
    initializeMsal([
      {
        provide: Location,
        useValue: {
          path: jasmine
            .createSpy("path")
            .and.callFake((hash: boolean) =>
              hash ? "/path?code=123#code=456" : "/path"
            ),
          prepareExternalUrl: jasmine
            .createSpy("prepareExternalUrl")
            .and.callFake((url: string) => "/path"),
        },
      },
    ]);

    routeStateMock = {
      snapshot: {},
      url: "/path?code=123#code=456",
      root: {
        fragment: "code=456",
      },
    };

    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
      },
    ]);
    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));
    assertMaybeAsync(result, (result) => {
      expect(result.toString()).toEqual("/path");
      done();
    });
  });

  it("returns true if page contains code= in query parameters only", (done) => {
    initializeMsal([
      {
        provide: Location,
        useValue: {
          path: jasmine
            .createSpy("path")
            .and.callFake((hash: boolean) =>
              hash ? "/path?code=123" : "/path"
            ),
          prepareExternalUrl: jasmine
            .createSpy("prepareExternalUrl")
            .and.callFake((url: string) => "/path"),
        },
      },
    ]);

    routeStateMock = {
      snapshot: {},
      url: "/path?code=123",
      root: {
        fragment: null,
      },
    };

    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
      },
    ]);

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));
    assertMaybeAsync(result, (result) => {
      expect(result).toBeTrue();
      done();
    })
  });

  it("returns true if page route doesnt end with /code", (done) => {
    initializeMsal([
      {
        provide: Location,
        useValue: {
          path: jasmine
            .createSpy("path")
            .and.callFake((hash: boolean) => (hash ? "/codes" : "/")),
          prepareExternalUrl: jasmine
            .createSpy("prepareExternalUrl")
            .and.callFake((url: string) => "#/codes"),
        },
      },
    ]);

    routeStateMock = {
      snapshot: {},
      url: "/codes",
      root: {
        fragment: null,
      },
    };

    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
      },
    ]);

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));
    assertMaybeAsync(result, (result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("returns true if page route doesnt end with /code (short path)", (done) => {
    initializeMsal([
      {
        provide: Location,
        useValue: {
          path: jasmine
            .createSpy("path")
            .and.callFake((hash: boolean) => (hash ? "/cod" : "/")),
          prepareExternalUrl: jasmine
            .createSpy("prepareExternalUrl")
            .and.callFake((url: string) => "#/cod"),
        },
      },
    ]);

    routeStateMock = {
      snapshot: {},
      url: "/cod",
      root: {
        fragment: null,
      },
    };

    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
      },
    ]);

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));

    assertMaybeAsync(result, (result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("returns false if page contains known successful response (hash routing)", (done) => {
    initializeMsal([
      {
        provide: Location,
        useValue: {
          path: jasmine
            .createSpy("path")
            .and.callFake((hash: boolean) => (hash ? "/code=" : "/")),
          prepareExternalUrl: jasmine
            .createSpy("prepareExternalUrl")
            .and.callFake((url: string) => "#/"),
        },
      },
    ]);

    routeStateMock = {
      snapshot: {},
      url: "/code",
      root: {
        fragment: null,
      },
    };

    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
      },
    ]);

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));

    assertMaybeAsync(result, (result) => {
      expect(result.toString()).toEqual("/");
      done();
    });
  });

  it("returns true for a logged in user", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
      },
    ]);

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));
    assertMaybeAsync(result, (result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("should return true after logging in with popup", (done) => {
    testConfiguration = {
      authRequest: (authService, state) => {
        expect(state).toBeDefined();
        expect(authService).toBeDefined();
        return {};
      },
    };
    initializeMsal();
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue(
      []
    );

    spyOn(MsalService.prototype, "loginPopup").and.returnValue(
      //@ts-ignore
      of(true)
    );

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));

    assertMaybeAsync(result, (result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("should return false after login with popup fails and no loginFailedRoute set", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue(
      []
    );

    spyOn(MsalService.prototype, "loginPopup").and.throwError("login error");

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));
    assertMaybeAsync(result, (result) => {
      expect(result).toBeFalse();
      done();
    });
  });

  it("should return loginFailedRoute after login with popup fails and loginFailedRoute set", (done) => {
    testLoginFailedRoute = "failed";
    initializeMsal();

    spyOn(guard, "parseUrl").and.returnValue(
      testLoginFailedRoute as unknown as UrlTree
    );

    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue(
      []
    );

    spyOn(MsalService.prototype, "loginPopup").and.throwError("login error");

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));

    assertMaybeAsync(result, (result) => {
      expect(result).toEqual("failed" as unknown as UrlTree);
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

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue(
      []
    );

    spyOn(PublicClientApplication.prototype, "loginRedirect").and.returnValue(
      new Promise<void>((resolve) => {
        resolve();
      })
    );

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));

    assertMaybeAsync(result, (result) => {
      expect(result).toBeFalse();
      done();
    })

    });

  it("canActivateChild returns true with logged in user", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
      },
    ]);

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard(routeMock, routeStateMock));
    assertMaybeAsync(result, (result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("canLoad returns true with logged in user", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      {
        homeAccountId: "test",
        localAccountId: "test",
        environment: "test",
        tenantId: "test",
        username: "test",
      },
    ]);

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard({} as any, []));
    assertMaybeAsync(result, (result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("canLoad returns false with no users logged in", (done) => {
    spyOn(MsalService.prototype, "handleRedirectObservable").and.returnValue(
      //@ts-ignore
      of("test")
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue(
      []
    );

    const result = TestBed.runInInjectionContext(() => rbacRolelessGuard({} as any, []));
    assertMaybeAsync(result, (result) => {
      expect(result).toBeFalse();
      done();
    });
  });
})
