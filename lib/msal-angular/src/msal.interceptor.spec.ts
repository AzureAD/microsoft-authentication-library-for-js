import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MsalModule, MsalService, MsalInterceptor, MsalBroadcastService } from './public-api';

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
      redirectUri: 'http://localhost:4200'
    }
  });
}

describe('MsalInterceptor', () => {
  let interceptor: MsalInterceptor;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeAll(() => {
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        MsalModule.forRoot(MSALInstanceFactory(), null, {
          interactionType: InteractionType.Popup, 
          protectedResourceMap: new Map([
            ["https://graph.microsoft.com/v1.0/me", ["user.read"]],
            ["https://myapplication.com/user/*", ["customscope.read"]],
            ["http://localhost:4200/details", ["details.read"]],
            ["https://*.myapplication.com/*", ["mail.read"]],
            ["https://api.test.com", ["default.scope1"]],
            ["https://*.test.com", ["default.scope2"]],
            ["http://localhost:3000", ["base.scope"]]
        ])
        })
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

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([{
      homeAccountId: "test",
      environment: "test",
      tenantId: "test",
      username: "test"
    }]);

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

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([{
      homeAccountId: "test",
      environment: "test",
      tenantId: "test",
      username: "test"
    }]);

    httpClient.get("https://myapplication.com/user/1").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://myapplication.com/user/1");
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

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([{
      homeAccountId: "test",
      environment: "test",
      tenantId: "test",
      username: "test"
    }]);

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

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([{
      homeAccountId: "test",
      environment: "test",
      tenantId: "test",
      username: "test"
    }]);

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

    spyOn(PublicClientApplication.prototype, "getAllAccounts").and.returnValue([{
      homeAccountId: "test",
      environment: "test",
      tenantId: "test",
      username: "test"
    }]);

    httpClient.get("https://api.test.com").subscribe();
    setTimeout(() => {
      const request = httpMock.expectOne("https://api.test.com");
      request.flush({ data: "test" });
      expect(request.request.headers.get("Authorization")).toEqual("Bearer access-token");
      httpMock.verify();
      done();
    }, 200);
  });

});
