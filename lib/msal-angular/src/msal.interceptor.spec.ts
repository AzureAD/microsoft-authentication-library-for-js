import { TestBed } from "@angular/core/testing";
import { Location } from "@angular/common";
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";

import {
  AccountInfo,
  AuthError,
  InteractionStatus,
  InteractionType,
  IPublicClientApplication,
  PublicClientApplication,
  SilentRequest,
} from "@azure/msal-browser";
import { BehaviorSubject } from "rxjs";
import {
  MsalModule,
  MsalService,
  MsalInterceptor,
  MsalBroadcastService,
  MsalInterceptorConfiguration,
  ProtectedResourceScopes,
} from "./public-api";
import { provideRouter } from "@angular/router";

let interceptor: MsalInterceptor;
let httpMock: HttpTestingController;
let httpClient: HttpClient;
let testInteractionType: InteractionType;

let testInterceptorConfig: Partial<MsalInterceptorConfiguration> = {};

const sampleAccountInfo: AccountInfo = {
  homeAccountId: "test",
  localAccountId: "test",
  environment: "test",
  tenantId: "test-tenant",
  username: "test",
};

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: "b5c2e510-4a17-4feb-b219-e55aa5b74144",
      redirectUri: "http://localhost:4200",
    },
  });
}

function MSALInterceptorFactory(): MsalInterceptorConfiguration {
  return {
    //@ts-ignore
    interactionType: testInteractionType,
    protectedResourceMap: new Map<
      string,
      Array<string | ProtectedResourceScopes> | null
    >([
      ["https://MY_API_SITE_2", ["api://MY_API_SITE_2/as_user"]],
      ["https://MY_API_SITE_1", ["api://MY_API_SITE_1/as_user"]],
      ["https://graph.microsoft.com/v1.0/me", ["user.read"]],
      ["relative/me", ["relative.scope"]],
      ["https://myapplication.com/user/*", ["customscope.read"]],
      ["https://*.myapplication.com/*", ["mail.read"]],
      ["https://api.test.com", ["default.scope1"]],
      ["https://*.test.com", ["default.scope2"]],
      ["http://localhost:3000/unprotect", null],
      [
        "http://localhost:3000/unprotect/post",
        [{ httpMethod: "POST", scopes: null }],
      ],
      ["http://localhost:3000/", ["base.scope"]],
      ["http://localhost:9876/tenant?abc", ["query.scope"]],
      ["http://applicationA/slash/", ["customA.scope"]],
      ["http://applicationB/noSlash", ["customB.scope"]],
      [
        "http://applicationC.com",
        [
          {
            httpMethod: "POST",
            scopes: ["write.scope"],
          },
        ],
      ],
      [
        "http://applicationD.com",
        [
          "all.scope",
          {
            httpMethod: "GET",
            scopes: ["read.scope"],
          },
          {
            httpMethod: "Post",
            scopes: ["info.scope"],
          },
        ],
      ],
      ["http://applicationE.com/profile/", ["customE.scope"]],
      ["http://applicationF.com/profile/", ["customF.scope"]],
    ]),
    authRequest: testInterceptorConfig.authRequest,
    // Legacy test suite: use legacy matching to preserve existing test coverage
    strictMatching: false,
  };
}

function initializeMsal() {
  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    imports: [
      MsalModule.forRoot(MSALInstanceFactory(), null, MSALInterceptorFactory()),
    ],
    providers: [
      MsalInterceptor,
      MsalService,
      MsalBroadcastService,
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
        multi: true,
      },
      Location,
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
    teardown: { destroyAfterEach: false },
  });

  interceptor = TestBed.inject(MsalInterceptor);
  httpMock = TestBed.inject(HttpTestingController);
  httpClient = TestBed.inject(HttpClient);
}

describe("MsalInterceptor", () => {
  beforeEach(() => {
    testInteractionType = InteractionType.Popup;
    testInterceptorConfig = {};
    initializeMsal();
  });

  it("throws error if incorrect interaction type set in interceptor configuration", (done) => {
    testInteractionType = InteractionType.Silent;
    initializeMsal();

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe({
      error: (error) => {
        expect(error.errorCode).toBe("invalid_interaction_type");
        expect(error.errorMessage).toBe(
          "Invalid interaction type provided to MSAL Interceptor. InteractionType.Popup, InteractionType.Redirect must be provided in the msalInterceptorConfiguration"
        );
        testInteractionType = InteractionType.Popup;
        done();
      },
    });
  });

  it("does not attach authorization header for unprotected resource", (done) => {
    httpClient
      .get("http://localhost/api")
      .subscribe((response) => expect(response).toBeTruthy());

    const request = httpMock.expectOne("http://localhost/api");
    request.flush({ data: "test" });
    expect(request.request.headers.get("Authorization")).toBeUndefined;
    httpMock.verify();
    done();
  });

  it("does not attach authorization header for own domain", (done) => {
    httpClient
      .get("http://localhost:9876")
      .subscribe((response) => expect(response).toBeTruthy());

    const request = httpMock.expectOne("http://localhost:9876");
    request.flush({ data: "test" });
    expect(request.request.headers.get("Authorization")).toBeUndefined;
    httpMock.verify();
    done();
  });

  it("attaches authorization header with access token for protected resource with exact match", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(
      PublicClientApplication.prototype,
      "getActiveAccount"
    ).and.returnValue(sampleAccountInfo);

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://graph.microsoft.com/v1.0/me");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["user.read"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token via interaction if acquireTokenSilent returns null access token, interaction type is Popup and interaction invocation waits for interaction status becomes None", (done) => {
    const _inProgress = new BehaviorSubject<InteractionStatus>(
      InteractionStatus.Startup
    );
    const msalBroadcastService = TestBed.inject(MsalBroadcastService);

    msalBroadcastService.inProgress$ = _inProgress.asObservable();

    const spy1 = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: null,
        });
      })
    );

    const spy2 = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenPopup"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(
      PublicClientApplication.prototype,
      "getActiveAccount"
    ).and.returnValue(sampleAccountInfo);

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectNone(
        "https://graph.microsoft.com/v1.0/me"
      );
      expect(request).toBeUndefined();
      expect(spy1).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["user.read"],
      });
      expect(spy2).not.toHaveBeenCalled();
      httpMock.verify();

      _inProgress.next(InteractionStatus.None);
    }, 200);

    setTimeout(() => {
      const request = httpMock.expectOne("https://graph.microsoft.com/v1.0/me");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy2).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["user.read"],
      });
      httpMock.verify();
      done();
    }, 400);
  });

  it("attaches authorization header with access token for protected resource with wildcard", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("https://myapplication.com/user/1").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://myapplication.com/user/1");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["customscope.read"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token to url for protected resource with wildcard, url has multiple slashes", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("https://myapplication.com/user/1/2/3").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne(
        "https://myapplication.com/user/1/2/3"
      );
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["customscope.read"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for protected resource with multiple wildcards", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("https://mail.myapplication.com/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://mail.myapplication.com/me");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["mail.read"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for base url as protected resource", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("http://localhost:3000/base").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("http://localhost:3000/base");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["base.scope"],
      });

      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for multiple matching entries in protected resource, scopes are for first matching entry", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("https://api.test.com").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://api.test.com");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["default.scope1"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("does not attach authorization header when scopes set to null, and resource is before any base url or wildcards", (done) => {
    httpClient
      .get("http://localhost:3000/unprotect")
      .subscribe((response) => expect(response).toBeTruthy());

    const request = httpMock.expectOne("http://localhost:3000/unprotect");
    request.flush({ data: "test" });
    expect(request.request.headers.get("Authorization")).toBeUndefined;
    httpMock.verify();
    done();
  });

  it("does not attach authorization header when scopes set to null on specific http method, and resource is before any base url or wildcards", (done) => {
    httpClient
      .post("http://localhost:3000/unprotect/post", {})
      .subscribe((response) => expect(response).toBeTruthy());

    const request = httpMock.expectOne("http://localhost:3000/unprotect/post");
    request.flush({ data: "test" });
    expect(request.request.headers.get("Authorization")).toBeUndefined;
    httpMock.verify();
    done();
  });

  it("attaches authorization header with access token from acquireTokenPopup if acquireTokenSilent fails in interceptor, interaction type is Popup and interaction status is None", (done) => {
    const _inProgress = new BehaviorSubject<InteractionStatus>(
      InteractionStatus.None
    );
    const msalBroadcastService = TestBed.inject(MsalBroadcastService);

    msalBroadcastService.inProgress$ = _inProgress.asObservable();

    const sampleError = new AuthError("123", "message");
    const sampleAccessToken = {
      accessToken: "123abc",
    };

    const spy1 = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve, reject) => {
        reject(sampleError);
      })
    );

    const spy2 = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenPopup"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve(sampleAccessToken);
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://graph.microsoft.com/v1.0/me");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer 123abc"
      );
      expect(spy1).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["user.read"],
      });
      expect(spy2).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["user.read"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("does not attach authorization header if acquireTokenSilent fails in interceptor, interaction type is Redirect and interaction status is None", (done) => {
    testInteractionType = InteractionType.Redirect;
    initializeMsal();

    const _inProgress = new BehaviorSubject<InteractionStatus>(
      InteractionStatus.None
    );
    const msalBroadcastService = TestBed.inject(MsalBroadcastService);

    msalBroadcastService.inProgress$ = _inProgress.asObservable();

    const sampleError = new AuthError("123", "message");

    spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve, reject) => {
        reject(sampleError);
      })
    );

    spyOn(
      PublicClientApplication.prototype,
      "acquireTokenRedirect"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve();
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectNone(
        "https://graph.microsoft.com/v1.0/me"
      );
      expect(request).toBeUndefined();
      httpMock.verify();
      done();
    }, 200);
  });

  it("does not invoke interaction if acquireTokenSilent fails in interceptor and interaction status other than None", (done) => {
    const _inProgress = new BehaviorSubject<InteractionStatus>(
      InteractionStatus.Startup
    );
    const msalBroadcastService = TestBed.inject(MsalBroadcastService);

    msalBroadcastService.inProgress$ = _inProgress.asObservable();

    const sampleError = new AuthError("123", "message");
    const sampleAccessToken = {
      accessToken: "123abc",
    };

    const spy1 = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve, reject) => {
        reject(sampleError);
      })
    );

    const spy2 = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenPopup"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve(sampleAccessToken);
      })
    );

    const spy3 = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenRedirect"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve();
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectNone(
        "https://graph.microsoft.com/v1.0/me"
      );
      expect(request).toBeUndefined();
      expect(spy1).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["user.read"],
      });
      expect(spy2).not.toHaveBeenCalled();
      expect(spy3).not.toHaveBeenCalled();
      httpMock.verify();
      done();
    }, 200);
  });

  it("does not invoke interaction if acquireTokenSilent fails in interceptor and interaction status other than None and should invoke acquireTokenSilent when status became None", (done) => {
    const _inProgress = new BehaviorSubject<InteractionStatus>(
      InteractionStatus.Startup
    );
    const msalBroadcastService = TestBed.inject(MsalBroadcastService);

    msalBroadcastService.inProgress$ = _inProgress.asObservable();

    const sampleError = new AuthError("123", "message");
    const sampleAccessToken = {
      accessToken: "123abc",
    };

    const spy1 = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve, reject) => {
        reject(sampleError);
      })
    );

    const spy2 = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenPopup"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve(sampleAccessToken);
      })
    );

    const spy3 = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenRedirect"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve();
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectNone(
        "https://graph.microsoft.com/v1.0/me"
      );
      expect(request).toBeUndefined();
      expect(spy1).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["user.read"],
      });
      expect(spy2).not.toHaveBeenCalled();
      expect(spy3).not.toHaveBeenCalled();
      httpMock.verify();

      _inProgress.next(InteractionStatus.None);
    }, 200);

    setTimeout(() => {
      expect(spy1.calls.mostRecent().args).toEqual([
        { account: sampleAccountInfo, scopes: ["user.read"] },
      ]);
      expect(spy1).toHaveBeenCalledTimes(2);
      done();
    }, 400);
  });

  it("keeps original authority, https://login.microsoftonline.com/common", (done) => {
    const originalAuthority = "https://login.microsoftonline.com/common";

    testInterceptorConfig.authRequest = {
      authority: originalAuthority,
    };
    initializeMsal();
    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.callFake(
      (silentRequest: SilentRequest) =>
        new Promise((resolve) => {
          //@ts-ignore
          resolve({
            accessToken: `access-token-for-${silentRequest.authority}`,
          });
        })
    );

    httpClient.get("https://api.test.com").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://api.test.com");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token-for-https://login.microsoftonline.com/common"
      );
      expect(spy).toHaveBeenCalledWith({
        authority: originalAuthority,
        account: sampleAccountInfo,
        scopes: ["default.scope1"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("calls dynamic authority with account, authority override", (done) => {
    testInterceptorConfig.authRequest = (msalService, httpReq, authRequest) => {
      return {
        ...authRequest,
        authority: `https://login.microsoftonline.com/${authRequest.account.tenantId}`,
      };
    };
    initializeMsal();
    spyOn(
      PublicClientApplication.prototype,
      "getActiveAccount"
    ).and.returnValue(sampleAccountInfo);
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.callFake(
      (silentRequest: SilentRequest) =>
        new Promise((resolve) => {
          //@ts-ignore
          resolve({
            accessToken: `access-token-for-${silentRequest.authority}`,
          });
        })
    );

    httpClient.get("https://api.test.com").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://api.test.com");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token-for-https://login.microsoftonline.com/test-tenant"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        authority: "https://login.microsoftonline.com/test-tenant",
        scopes: ["default.scope1"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for protected resource with queries", (done) => {
    spyOn(
      PublicClientApplication.prototype,
      "getActiveAccount"
    ).and.returnValue(sampleAccountInfo);
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    httpClient.get("http://localhost:9876/tenant?abc").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("http://localhost:9876/tenant?abc");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["query.scope"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for protected resource with trailing slash", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("http://applicationA/slash").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("http://applicationA/slash");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["customA.scope"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for endpoint with trailing slash", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("http://applicationB/noSlash/").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("http://applicationB/noSlash/");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["customB.scope"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for relative endpoint", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("http://localhost:9876/relative/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("http://localhost:9876/relative/me");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["relative.scope"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for relative endpoint which includes query", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("/tenant?abc").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("/tenant?abc");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["query.scope"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for endpoint with HTTP methods specified", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.post("http://applicationC.com", {}).subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("http://applicationC.com");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["write.scope"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("does not attach authorization header when request HTTP method is not in protectedResourceMap", (done) => {
    httpClient
      .get("http://applicationC.com")
      .subscribe((response) => expect(response).toBeTruthy());

    const request = httpMock.expectOne("http://applicationC.com");
    request.flush({ data: "test" });
    expect(request.request.headers.get("Authorization")).toBeUndefined;
    httpMock.verify();
    done();
  });

  it("attaches authorization header with access token for endpoint with scopes in string array and with HTTP methods specified", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.get("http://applicationD.com").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("http://applicationD.com");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["all.scope", "read.scope"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("does not attach authorization header if request HTTP method with scope is not in protectedResourceMap", (done) => {
    httpClient
      .get("http://applicationC.com")
      .subscribe((response) => expect(response).toBeTruthy());

    const request = httpMock.expectOne("http://applicationC.com");
    request.flush({ data: "test" });
    expect(request.request.headers.get("Authorization")).toBeUndefined;
    httpMock.verify();
    done();
  });

  it("attaches authorization header with access token for endpoint with HTTP methods specified, regardless of casing of HTTP method", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.post("http://applicationD.com", {}).subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("http://applicationD.com");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["all.scope", "info.scope"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("does not attach authorization header if relative endpoints match but absolute url does not match", (done) => {
    httpClient
      .get("http://applicationZ.com/noSlash")
      .subscribe((response) => expect(response).toBeTruthy());

    const request = httpMock.expectOne("http://applicationZ.com/noSlash");
    request.flush({ data: "test" });
    expect(request.request.headers.get("Authorization")).toBeUndefined;
    httpMock.verify();
    done();
  });

  it("attaches authorization header with access token for correct endpoint even though an earlier endpoint in the protectedResourceMap has a matching relative endpoint", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient.post("http://applicationF.com/profile/", {}).subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("http://applicationF.com/profile/");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["customF.scope"],
      });
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token when endpoint match is in HostNameAndPort instead of query string", (done) => {
    const spy = spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token",
        });
      })
    );

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([
      sampleAccountInfo,
    ]);

    httpClient
      .get(
        "https://MY_API_SITE_1/api/sites?$filter=siteUrl eq 'https://MY_API_SITE_2'"
      )
      .subscribe();

    setTimeout(() => {
      const request = httpMock.expectOne(
        "https://MY_API_SITE_1/api/sites?$filter=siteUrl eq 'https://MY_API_SITE_2'"
      );
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer access-token"
      );
      expect(spy).toHaveBeenCalledWith({
        account: sampleAccountInfo,
        scopes: ["api://MY_API_SITE_1/as_user"],
      });
      httpMock.verify();
      done();
    }, 200);
  });
});

// ---------------------------------------------------------------------------
// matchPatternStrict / matchPattern helper tests
// ---------------------------------------------------------------------------
// These tests exercise the local matching helpers defined in MsalInterceptor.
// They are invoked indirectly through the interceptor's URL-matching flow.
// ---------------------------------------------------------------------------

function MSALStrictInterceptorFactory(
  resourceMap: Map<string, Array<string | ProtectedResourceScopes> | null>,
  strict?: boolean
): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap: resourceMap,
    strictMatching: strict,
  };
}

function initializeMsalStrict(
  resourceMap: Map<string, Array<string | ProtectedResourceScopes> | null>,
  strict?: boolean
) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      MsalModule.forRoot(
        MSALInstanceFactory(),
        null,
        MSALStrictInterceptorFactory(resourceMap, strict)
      ),
    ],
    providers: [
      MsalInterceptor,
      MsalService,
      MsalBroadcastService,
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
        multi: true,
      },
      Location,
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
    teardown: { destroyAfterEach: false },
  });

  interceptor = TestBed.inject(MsalInterceptor);
  httpMock = TestBed.inject(HttpTestingController);
  httpClient = TestBed.inject(HttpClient);
}

// ---------------------------------------------------------------------------
// matchPatternStrict direct unit tests (exercising the private helper via cast)
// ---------------------------------------------------------------------------
describe("matchPatternStrict unit tests", () => {
  // Access the private method via cast for direct unit testing.
  let match: (pattern: string, input: string, component: "protocol" | "host" | "path" | "search" | "hash") => boolean;

  beforeEach(() => {
    const emptyMap = new Map<string, Array<string | ProtectedResourceScopes> | null>();
    initializeMsalStrict(emptyMap);
    match = (interceptor as any).matchPatternStrict.bind(interceptor);
  });

  describe("host component - wildcard stays within a single DNS label", () => {
    it("wildcard host pattern matches intended subdomain", () => {
      expect(match("*.contoso.com", "app.contoso.com", "host")).toBe(true);
    });

    it("wildcard host pattern does not match when wildcard would span a dot boundary", () => {
      expect(match("*.contoso.com", "othercontoso.com", "host")).toBe(false);
    });

    it("wildcard host pattern does not match multi-label wildcard expansion", () => {
      expect(match("*.contoso.com", "a.b.contoso.com", "host")).toBe(false);
    });

    it("exact host pattern matches its intended host", () => {
      expect(match("api.contoso.com", "api.contoso.com", "host")).toBe(true);
    });

    it("exact host pattern does not match a different host", () => {
      expect(match("api.contoso.com", "other.contoso.com", "host")).toBe(false);
    });
  });

  describe("dot metacharacter escaping", () => {
    it("dot in pattern is treated as a literal dot", () => {
      expect(match("example.com", "example.com", "host")).toBe(true);
    });

    it("dot in pattern does not match a non-dot character", () => {
      expect(match("example.com", "exampleXcom", "host")).toBe(false);
    });
  });

  describe("anchoring - full-string match required", () => {
    it("pattern must match the full string, not just a substring", () => {
      expect(match("/user/1", "/user/1/extra", "path")).toBe(false);
    });

    it("pattern must not match a prefix of the input", () => {
      expect(match("contoso", "contoso.com", "host")).toBe(false);
    });

    it("pattern must not match a suffix of the input", () => {
      expect(match("contoso.com", "api.contoso.com", "host")).toBe(false);
    });
  });

  describe("path component - wildcard matches across slashes", () => {
    it("path wildcard matches a single path segment", () => {
      expect(match("/user/*", "/user/1", "path")).toBe(true);
    });

    it("path wildcard matches multiple path segments", () => {
      expect(match("/user/*", "/user/1/2/3", "path")).toBe(true);
    });

    it("path wildcard does not match a completely different path", () => {
      expect(match("/user/*", "/admin/1", "path")).toBe(false);
    });
  });

  describe("question mark is a literal (URL query separator)", () => {
    it("? in a pattern matches a literal ? in the input", () => {
      expect(match("/items?page=1", "/items?page=1", "path")).toBe(true);
    });

    it("? in a pattern does not match a different character", () => {
      expect(match("/items?page=1", "/itemsXpage=1", "path")).toBe(false);
    });

    it("pattern with ? does not match input missing the ? character", () => {
      expect(match("/items?page=1", "/itemspage=1", "path")).toBe(false);
    });
  });

  describe("host pattern only matches the host component", () => {
    it("wildcard host pattern does not match a completely different hostname", () => {
      expect(match("*.microsoft.com", "other.com", "host")).toBe(false);
    });

    it("wildcard host pattern does not match a host with no dot before the domain", () => {
      expect(match("*.microsoft.com", "othermicrosoft.com", "host")).toBe(false);
    });

    it("wildcard host pattern matches only the correct host component", () => {
      expect(match("*.microsoft.com", "login.microsoft.com", "host")).toBe(true);
    });
  });

  describe("no component-specific semantics for path - defaults to permissive wildcard", () => {
    it("* matches across any characters in path component", () => {
      expect(match("/user/*", "/user/1", "path")).toBe(true);
    });

    it("exact match succeeds in path component", () => {
      expect(match("/v1.0/me", "/v1.0/me", "path")).toBe(true);
    });

    it("non-match returns false in path component", () => {
      expect(match("/v1.0/me", "/v1.0/other", "path")).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// matchPatternStrict integration tests (via interceptor matching flow)
// ---------------------------------------------------------------------------
describe("msal.interceptor matchPatternStrict", () => {
  const hostwildcardMap = new Map<
    string,
    Array<string | ProtectedResourceScopes> | null
  >([
    ["https://*.contoso.com/api", ["contoso.scope"]],
    ["https://exact.api.com/data", ["exact.scope"]],
  ]);

  describe("host wildcard matching", () => {
    beforeEach(() => {
      initializeMsalStrict(hostwildcardMap);
    });

    it("msal.interceptor matchPatternStrict: host wildcard matches a single-label subdomain", (done) => {
      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve) => {
          // @ts-ignore
          resolve({ accessToken: "strict-token" });
        })
      );
      spyOn(
        PublicClientApplication.prototype,
        "getAllAccounts"
      ).and.returnValue([sampleAccountInfo]);

      httpClient.get("https://app.contoso.com/api").subscribe();
      setTimeout(() => {
        const request = httpMock.expectOne("https://app.contoso.com/api");
        request.flush({ data: "test" });
        expect(request.request.headers.get("Authorization")).toEqual(
          "Bearer strict-token"
        );
        httpMock.verify();
        done();
      }, 200);
    });

    it("msal.interceptor matchPatternStrict: host wildcard does not span dot separators", (done) => {
      httpClient
        .get("https://a.b.contoso.com/api")
        .subscribe((response) => expect(response).toBeTruthy());

      const request = httpMock.expectOne("https://a.b.contoso.com/api");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toBeNull();
      httpMock.verify();
      done();
    });

    it("msal.interceptor matchPatternStrict: pattern is anchored (no substring matches)", (done) => {
      httpClient
        .get("https://exact.api.com/data/extra")
        .subscribe((response) => expect(response).toBeTruthy());

      const request = httpMock.expectOne("https://exact.api.com/data/extra");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toBeNull();
      httpMock.verify();
      done();
    });

    it("msal.interceptor matchPatternStrict: treats regex metacharacters as literals", (done) => {
      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve) => {
          // @ts-ignore
          resolve({ accessToken: "exact-token" });
        })
      );
      spyOn(
        PublicClientApplication.prototype,
        "getAllAccounts"
      ).and.returnValue([sampleAccountInfo]);

      httpClient.get("https://exact.api.com/data").subscribe();
      setTimeout(() => {
        const request = httpMock.expectOne("https://exact.api.com/data");
        request.flush({ data: "test" });
        expect(request.request.headers.get("Authorization")).toEqual(
          "Bearer exact-token"
        );
        httpMock.verify();
        done();
      }, 200);
    });
  });

  describe("pathname matching", () => {
    const pathMap = new Map<
      string,
      Array<string | ProtectedResourceScopes> | null
    >([["https://myapplication.com/user/*", ["customscope.read"]]]);

    beforeEach(() => {
      initializeMsalStrict(pathMap);
    });

    it("msal.interceptor matchPatternStrict: pathname wildcard matches expected segments", (done) => {
      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve) => {
          // @ts-ignore
          resolve({ accessToken: "path-token" });
        })
      );
      spyOn(
        PublicClientApplication.prototype,
        "getAllAccounts"
      ).and.returnValue([sampleAccountInfo]);

      httpClient.get("https://myapplication.com/user/1").subscribe();
      setTimeout(() => {
        const request = httpMock.expectOne(
          "https://myapplication.com/user/1"
        );
        request.flush({ data: "test" });
        expect(request.request.headers.get("Authorization")).toEqual(
          "Bearer path-token"
        );
        httpMock.verify();
        done();
      }, 200);
    });
  });
});

describe("msal.interceptor matchPattern (legacy)", () => {
  it("msal.interceptor matchPattern: legacy behavior is unchanged for existing patterns", (done) => {
    const legacyMap = new Map<
      string,
      Array<string | ProtectedResourceScopes> | null
    >([
      ["https://*.myapplication.com/*", ["mail.read"]],
    ]);
    initializeMsalStrict(legacyMap, false);

    spyOn(
      PublicClientApplication.prototype,
      "acquireTokenSilent"
    ).and.returnValue(
      new Promise((resolve) => {
        // @ts-ignore
        resolve({ accessToken: "legacy-token" });
      })
    );
    spyOn(
      PublicClientApplication.prototype,
      "getAllAccounts"
    ).and.returnValue([sampleAccountInfo]);

    httpClient.get("https://mail.myapplication.com/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne(
        "https://mail.myapplication.com/me"
      );
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual(
        "Bearer legacy-token"
      );
      httpMock.verify();
      done();
    }, 200);
  });
});

// ---------------------------------------------------------------------------
// MsalInterceptor strict matching integration tests
// ---------------------------------------------------------------------------
describe("MsalInterceptor - strictMatching option", () => {
  describe("MsalInterceptor: uses strict matching by default for protectedResourceMap entries", () => {
    const defaultStrictMap = new Map<
      string,
      Array<string | ProtectedResourceScopes> | null
    >([
      ["https://*.contoso.com/api", ["contoso.scope"]],
      ["https://exact.api.com/data", ["exact.scope"]],
    ]);

    beforeEach(() => {
      // No strictMatching field set — should default to strict (v5)
      initializeMsalStrict(defaultStrictMap);
    });

    it("MsalInterceptor: attaches authorization header only when URL components match configured pattern", (done) => {
      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve) => {
          // @ts-ignore
          resolve({ accessToken: "default-strict-token" });
        })
      );
      spyOn(
        PublicClientApplication.prototype,
        "getAllAccounts"
      ).and.returnValue([sampleAccountInfo]);

      httpClient.get("https://app.contoso.com/api").subscribe();
      setTimeout(() => {
        const request = httpMock.expectOne("https://app.contoso.com/api");
        request.flush({ data: "test" });
        expect(request.request.headers.get("Authorization")).toEqual(
          "Bearer default-strict-token"
        );
        httpMock.verify();
        done();
      }, 200);
    });

    it("MsalInterceptor: strict matching applies host label boundaries for wildcard hosts", (done) => {
      httpClient
        .get("https://a.b.contoso.com/api")
        .subscribe((response) => expect(response).toBeTruthy());

      const request = httpMock.expectOne("https://a.b.contoso.com/api");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toBeNull();
      httpMock.verify();
      done();
    });
  });

  describe("MsalInterceptor: strictMatching=false uses legacy matching behavior", () => {
    const legacyMap = new Map<
      string,
      Array<string | ProtectedResourceScopes> | null
    >([
      ["https://*.contoso.com/api", ["contoso.scope"]],
    ]);

    beforeEach(() => {
      initializeMsalStrict(legacyMap, false);
    });

    it("MsalInterceptor: strictMatching=false uses legacy matching behavior", (done) => {
      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve) => {
          // @ts-ignore
          resolve({ accessToken: "legacy-compat-token" });
        })
      );
      spyOn(
        PublicClientApplication.prototype,
        "getAllAccounts"
      ).and.returnValue([sampleAccountInfo]);

      httpClient.get("https://app.contoso.com/api").subscribe();
      setTimeout(() => {
        const request = httpMock.expectOne("https://app.contoso.com/api");
        request.flush({ data: "test" });
        expect(request.request.headers.get("Authorization")).toEqual(
          "Bearer legacy-compat-token"
        );
        httpMock.verify();
        done();
      }, 200);
    });
  });

  describe("strictMatching: true - host pattern does not match hostnames in the query string", () => {
    const microsoftResourceMap = new Map<
      string,
      Array<string | ProtectedResourceScopes> | null
    >([["https://*.microsoft.com", ["microsoft.scope"]]]);

    beforeEach(() => {
      initializeMsalStrict(microsoftResourceMap);
    });

    it("does not attach authorization header when the matched hostname appears only in the query string", (done) => {
      httpClient
        .get("http://other.com?redirect=login.microsoft.com")
        .subscribe((response) => expect(response).toBeTruthy());

      const request = httpMock.expectOne(
        "http://other.com?redirect=login.microsoft.com"
      );
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toBeNull();
      httpMock.verify();
      done();
    });

    it("attaches authorization header for an actual microsoft.com subdomain request", (done) => {
      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve) => {
          // @ts-ignore
          resolve({ accessToken: "ms-token" });
        })
      );
      spyOn(
        PublicClientApplication.prototype,
        "getAllAccounts"
      ).and.returnValue([sampleAccountInfo]);

      httpClient.get("https://login.microsoft.com").subscribe();
      setTimeout(() => {
        const request = httpMock.expectOne("https://login.microsoft.com");
        request.flush({ data: "test" });
        expect(request.request.headers.get("Authorization")).toEqual(
          "Bearer ms-token"
        );
        httpMock.verify();
        done();
      }, 200);
    });
  });
});
