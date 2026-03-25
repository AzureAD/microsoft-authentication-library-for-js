import { TestBed } from "@angular/core/testing";
import { Location } from "@angular/common";
import { HTTP_INTERCEPTORS, HttpClient } from "@angular/common/http";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
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

let interceptor: MsalInterceptor;
let httpMock: HttpTestingController;
let httpClient: HttpClient;
let testInteractionType: InteractionType;

let testInterceptorConfig: Partial<MsalInterceptorConfiguration> = {};
let testStrictMatching: boolean | undefined = undefined;

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
      clientId: "0845a021-afdf-4126-abdd-099c5e6948e1",
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
    strictMatching: testStrictMatching,
  };
}

function initializeMsal() {
  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
      RouterTestingModule,
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
    testStrictMatching = undefined;
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
// strictMatching option tests
// ---------------------------------------------------------------------------
// These tests verify that when strictMatching: true is set in the interceptor
// configuration, URL component pattern matching uses anchored, literal-correct
// semantics. Legacy behaviour is exercised in the main describe block above.
// ---------------------------------------------------------------------------

function MSALStrictInterceptorFactory(
  resourceMap: Map<string, Array<string | ProtectedResourceScopes> | null>
): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap: resourceMap,
    strictMatching: true,
  };
}

function initializeMsalStrict(
  resourceMap: Map<string, Array<string | ProtectedResourceScopes> | null>
) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
      RouterTestingModule,
      MsalModule.forRoot(
        MSALInstanceFactory(),
        null,
        MSALStrictInterceptorFactory(resourceMap)
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
    ],
    teardown: { destroyAfterEach: false },
  });

  interceptor = TestBed.inject(MsalInterceptor);
  httpMock = TestBed.inject(HttpTestingController);
  httpClient = TestBed.inject(HttpClient);
}

describe("MsalInterceptor - strictMatching option", () => {
  describe("strictMatching: false (default) - legacy behaviour is unchanged", () => {
    beforeEach(() => {
      testInteractionType = InteractionType.Popup;
      testInterceptorConfig = {};
      testStrictMatching = false;
      initializeMsal();
    });

    it("attaches authorization header for wildcard host pattern (legacy behaviour)", (done) => {
      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve) => {
          // @ts-ignore
          resolve({ accessToken: "access-token" });
        })
      );
      spyOn(
        PublicClientApplication.prototype,
        "getAllAccounts"
      ).and.returnValue([sampleAccountInfo]);

      httpClient.get("https://mail.myapplication.com/me").subscribe();
      setTimeout(() => {
        const request = httpMock.expectOne("https://mail.myapplication.com/me");
        request.flush({ data: "test" });
        expect(request.request.headers.get("Authorization")).toEqual(
          "Bearer access-token"
        );
        httpMock.verify();
        done();
      }, 200);
    });

    it("attaches authorization header for exact match (legacy behaviour)", (done) => {
      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve) => {
          // @ts-ignore
          resolve({ accessToken: "access-token" });
        })
      );
      spyOn(
        PublicClientApplication.prototype,
        "getAllAccounts"
      ).and.returnValue([sampleAccountInfo]);

      httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
      setTimeout(() => {
        const request = httpMock.expectOne(
          "https://graph.microsoft.com/v1.0/me"
        );
        request.flush({ data: "test" });
        expect(request.request.headers.get("Authorization")).toEqual(
          "Bearer access-token"
        );
        httpMock.verify();
        done();
      }, 200);
    });
  });

  describe("strictMatching: true - strict, anchored host pattern matching", () => {
    const strictResourceMap = new Map<
      string,
      Array<string | ProtectedResourceScopes> | null
    >([
      // Wildcard host pattern: intended to match only direct subdomains of contoso.com
      ["https://*.contoso.com/api", ["contoso.scope"]],
      // Exact host pattern for baseline check
      ["https://exact.api.com/data", ["exact.scope"]],
    ]);

    beforeEach(() => {
      initializeMsalStrict(strictResourceMap);
    });

    it("attaches authorization header when wildcard host matches an intended subdomain", (done) => {
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
        expect(
          PublicClientApplication.prototype.acquireTokenSilent
        ).toHaveBeenCalledWith(
          jasmine.objectContaining({ scopes: ["contoso.scope"] })
        );
        httpMock.verify();
        done();
      }, 200);
    });

    it("does not attach authorization header when wildcard host would need to span a dot boundary", (done) => {
      httpClient
        .get("https://othercontoso.com/api")
        .subscribe((response) => expect(response).toBeTruthy());

      const request = httpMock.expectOne("https://othercontoso.com/api");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toBeNull();
      httpMock.verify();
      done();
    });

    it("attaches authorization header for a second intended subdomain", (done) => {
      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve) => {
          // @ts-ignore
          resolve({ accessToken: "strict-token-2" });
        })
      );
      spyOn(
        PublicClientApplication.prototype,
        "getAllAccounts"
      ).and.returnValue([sampleAccountInfo]);

      httpClient.get("https://mail.contoso.com/api").subscribe();
      setTimeout(() => {
        const request = httpMock.expectOne("https://mail.contoso.com/api");
        request.flush({ data: "test" });
        expect(request.request.headers.get("Authorization")).toEqual(
          "Bearer strict-token-2"
        );
        httpMock.verify();
        done();
      }, 200);
    });

    it("does not attach authorization header when wildcard would need to span multiple dot boundaries", (done) => {
      httpClient
        .get("https://a.b.contoso.com/api")
        .subscribe((response) => expect(response).toBeTruthy());

      const request = httpMock.expectOne("https://a.b.contoso.com/api");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toBeNull();
      httpMock.verify();
      done();
    });

    it("attaches authorization header for an exact host pattern match", (done) => {
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

    it("does not attach authorization header when path does not match exactly under strict mode", (done) => {
      httpClient
        .get("https://exact.api.com/data/extra")
        .subscribe((response) => expect(response).toBeTruthy());

      const request = httpMock.expectOne("https://exact.api.com/data/extra");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toBeNull();
      httpMock.verify();
      done();
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

  describe("strictMatching: true - scheme-less wildcard key (*.microsoft.com) does not match other.com?redirect=login.microsoft.com", () => {
    /*
     * When a protectedResourceMap key has no scheme (e.g. "*.microsoft.com"),
     * getAbsoluteUrl() resolves it relative to the app's own origin, so
     * the anchor element used internally produces:
     *   href = "http://localhost:9876/*.microsoft.com"
     *     → host:     "localhost:9876"              (app's own origin, NOT microsoft.com)
     *     → pathname: "/*.microsoft.com"            (wildcard lands in PATH, not host)
     *
     * This contrasts with the full-scheme form (tested in the describe block above):
     *   href = "https://*.microsoft.com"
     *     → host:     "*.microsoft.com"             (wildcard lands in HOST as intended)
     *     → pathname: "/"
     *
     * Both forms correctly reject "other.com?redirect=login.microsoft.com", but for
     * different structural reasons:
     *   - full-scheme:  host check fails  (pattern [^.]*\.microsoft\.com ≠ other.com)
     *   - scheme-less:  host check fails  (literal localhost:9876 ≠ other.com)
     *
     * Prefer the full-scheme form (https://*.microsoft.com) so that the wildcard is
     * compared against the host component as intended, not silently moved into the path.
     */
    const schemelessResourceMap = new Map<
      string,
      Array<string | ProtectedResourceScopes> | null
    >([["*.microsoft.com", ["scope.less"]]]);

    beforeEach(() => {
      initializeMsalStrict(schemelessResourceMap);
    });

    it("does not attach header for other.com?redirect=login.microsoft.com (host mismatch: scheme-less key resolves to app origin, not microsoft.com)", (done) => {
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
  });
});
