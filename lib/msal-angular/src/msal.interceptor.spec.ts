import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { AccountInfo, AuthError, InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MsalModule, MsalService, MsalInterceptor, MsalBroadcastService } from './public-api';
import { MsalInterceptorConfiguration } from './msal.interceptor.config';

let interceptor: MsalInterceptor;
let httpMock: HttpTestingController;
let httpClient: HttpClient;
let testInteractionType: InteractionType;

const sampleAccountInfo: AccountInfo = {
  homeAccountId: "test",
  localAccountId: "test",
  environment: "test",
  tenantId: "test",
  username: "test"
}

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
      redirectUri: 'http://localhost:4200'
    }
  });
}

function MSALInterceptorFactory(): MsalInterceptorConfiguration {
  return {
    //@ts-ignore
    interactionType: testInteractionType,
    protectedResourceMap: new Map([
      ["https://graph.microsoft.com/v1.0/me", ["user.read"]],
      ["https://myapplication.com/user/*", ["customscope.read"]],
      ["http://localhost:4200/details", ["details.read"]],
      ["https://*.myapplication.com/*", ["mail.read"]],
      ["https://api.test.com", ["default.scope1"]],
      ["https://*.test.com", ["default.scope2"]],
      ["http://localhost:3000/unprotect", null],
      ["http://localhost:3000/", ["base.scope"]]
    ])
  }
}

function initializeMsal() {
  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
      RouterTestingModule,
      MsalModule.forRoot(MSALInstanceFactory(), null, MSALInterceptorFactory())
    ],
    providers: [
      MsalInterceptor,
      MsalService,
      MsalBroadcastService,
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
        multi: true,
      }
    ],
  });

  interceptor = TestBed.inject(MsalInterceptor);
  httpMock = TestBed.inject(HttpTestingController);
  httpClient = TestBed.inject(HttpClient);
}

describe('MsalInterceptor', () => {
  beforeEach(() => {
    testInteractionType = InteractionType.Popup;
    initializeMsal();
  });

  it("throws error if incorrect interaction type set in interceptor configuration", (done) => {
    testInteractionType = InteractionType.Silent;
    initializeMsal();

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe({
      error: (error) => {
        expect(error.errorCode).toBe("invalid_interaction_type");
        expect(error.errorMessage).toBe("Invalid interaction type provided to MSAL Interceptor. InteractionType.Popup, InteractionType.Redirect must be provided in the msalInterceptorConfiguration");
        testInteractionType = InteractionType.Popup;
        done();
      }
    });
  });

  it("does not attach authorization header for unprotected resource", () => {
    httpClient.get("http://localhost/api").subscribe(response => expect(response).toBeTruthy());

    const request = httpMock.expectOne("http://localhost/api");
    request.flush({ data: "test" });
    expect(request.request.headers.get("Authorization")).toBeUndefined;
    httpMock.verify();
  });

  it("does not attach authorization header for own domain", () => {
    httpClient.get("http://localhost:4200").subscribe(response => expect(response).toBeTruthy());

    const request = httpMock.expectOne("http://localhost:4200");
    request.flush({ data: "test" });
    expect(request.request.headers.get("Authorization")).toBeUndefined;
    httpMock.verify();
  });

  it("attaches authorization header with access token for protected resource with exact match", done => {
    spyOn(PublicClientApplication.prototype, "acquireTokenSilent").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token"
        });
      })
    ));

    spyOn(PublicClientApplication.prototype, "getActiveAccount").and.returnValue(sampleAccountInfo);

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://graph.microsoft.com/v1.0/me");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual("Bearer access-token");
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token via interaction if acquireTokenSilent returns null access token", done => {
    spyOn(PublicClientApplication.prototype, "acquireTokenSilent").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: null
        });
      })
    ));

    spyOn(PublicClientApplication.prototype, "acquireTokenPopup").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token"
        });
      })
    ));

    spyOn(PublicClientApplication.prototype, "getActiveAccount").and.returnValue(sampleAccountInfo);

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://graph.microsoft.com/v1.0/me");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual("Bearer access-token");
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for protected resource with wildcard", done => {
    spyOn(PublicClientApplication.prototype, "acquireTokenSilent").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token"
        });
      })
    ));

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([sampleAccountInfo]);

    httpClient.get("https://myapplication.com/user/1").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://myapplication.com/user/1");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual("Bearer access-token");
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token to urlfor protected resource with wildcard, url has multiple slashes", done => {
    spyOn(PublicClientApplication.prototype, "acquireTokenSilent").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token"
        });
      })
    ));

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([sampleAccountInfo]);

    httpClient.get("https://myapplication.com/user/1/2/3").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://myapplication.com/user/1/2/3");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual("Bearer access-token");
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for protected resource with multiple wildcards", done => {
    spyOn(PublicClientApplication.prototype, "acquireTokenSilent").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token"
        });
      })
    ));

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([sampleAccountInfo]);

    httpClient.get("https://mail.myapplication.com/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://mail.myapplication.com/me");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual("Bearer access-token");
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for base url as protected resource", done => {
    spyOn(PublicClientApplication.prototype, "acquireTokenSilent").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token"
        });
      })
    ));

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([sampleAccountInfo]);

    httpClient.get("http://localhost:3000/details").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("http://localhost:3000/details");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual("Bearer access-token");
      httpMock.verify();
      done();
    }, 200);
  });

  it("attaches authorization header with access token for multiple matching entries in protected resource", done => {
    spyOn(PublicClientApplication.prototype, "acquireTokenSilent").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve({
          accessToken: "access-token"
        });
      })
    ));

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([sampleAccountInfo]);

    httpClient.get("https://api.test.com").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://api.test.com");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual("Bearer access-token");
      httpMock.verify();
      done();
    }, 200);
  });

  it("does not attach authorization header when scopes set to null, and resource is before any base url or wildcards", () => {
    httpClient.get("http://localhost:3000/unprotect").subscribe(response => expect(response).toBeTruthy());

    const request = httpMock.expectOne("http://localhost:3000/unprotect");
    request.flush({ data: "test" });
    expect(request.request.headers.get("Authorization")).toBeUndefined;
    httpMock.verify();
  });

  it("attaches authorization header with access token from acquireTokenPopup if acquireTokenSilent fails in interceptor and interaction type is Popup", done => {
    const sampleError = new AuthError("123", "message");
    const sampleAccessToken = {
      accessToken: "123abc"
    };

    spyOn(PublicClientApplication.prototype, "acquireTokenSilent").and.returnValue((
      new Promise((resolve, reject) => {
        reject(sampleError);
      })
    ));

    spyOn(PublicClientApplication.prototype, "acquireTokenPopup").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve(sampleAccessToken);
      })
    ));

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([sampleAccountInfo]);

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://graph.microsoft.com/v1.0/me");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual("Bearer 123abc");
      httpMock.verify();
      done();
    }, 200);
  });

  it("does not attach authorization header if acquireTokenSilent fails in interceptor and interaction type is Redirect", done => {
    testInteractionType = InteractionType.Redirect;
    initializeMsal();
    const sampleError = new AuthError("123", "message");

    spyOn(PublicClientApplication.prototype, "acquireTokenSilent").and.returnValue((
      new Promise((resolve, reject) => {
        reject(sampleError);
      })
    ));

    spyOn(PublicClientApplication.prototype, "acquireTokenRedirect").and.returnValue((
      new Promise((resolve) => {
        //@ts-ignore
        resolve();
      })
    ));

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([sampleAccountInfo]);

    httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
    setTimeout(() => {
      const request = httpMock.expectNone("https://graph.microsoft.com/v1.0/me");
      expect(request).toBeUndefined();
      httpMock.verify();
      done();
    }, 200);
  });

});
