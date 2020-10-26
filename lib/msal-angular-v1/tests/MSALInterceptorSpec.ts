import { TestBed, inject, getTestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { MsalInterceptor } from "../src/msal.interceptor";
import { HTTP_INTERCEPTORS, HttpClient } from "@angular/common/http";
import { MsalService, MSAL_CONFIG, MSAL_CONFIG_ANGULAR, MsalAngularConfiguration, BroadcastService } from "../public_api";
import { Configuration, ServerHashParamKeys, UserAgentApplication } from "msal";
import {} from "jasmine";
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from "@angular/platform-browser-dynamic/testing";
import { RouterTestingModule } from "@angular/router/testing";

describe(`MSALInterceptor`, () => {
    let httpMock: HttpTestingController;
    let httpClient: HttpClient;

    beforeEach(() => {
        const clientId = "6226576d-37e9-49eb-b201-ec1eeb0029b6";
        TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, RouterTestingModule],
        providers: [
            MsalService,
            {
                provide: MSAL_CONFIG,
                useValue: {
                    auth: {
                        clientId,
                        authority: "https://login.microsoftonline.com/microsoft.onmicrosoft.com/",
                        validateAuthority: true,
                        redirectUri: "http://localhost:4200/",
                        postLogoutRedirectUri: "http://localhost:4200/",
                        navigateToLoginRequestUrl: true,
                    },
                    cache: {
                        cacheLocation: "localStorage",
                        storeAuthStateInCookie: false
                    }
                } as Configuration
            },
            {
                provide: MSAL_CONFIG_ANGULAR,
                useValue: {
                    popUp: false,
                    consentScopes: ["user.read", "mail.send"],
                    protectedResourceMap: [
                        ["https://graph.microsoft.com/v1.0/me", ["user.read"]]
                    ]
                } as MsalAngularConfiguration
            },
            BroadcastService,
            {
                provide: Storage,
                useClass: {
                    mockLocalStorage: "localStorage"
                }
            },
            {
                provide: HTTP_INTERCEPTORS,
                useClass: MsalInterceptor,
                multi: true,
            },
        ],
        });

        getTestBed().initTestEnvironment(
            BrowserDynamicTestingModule,
            platformBrowserDynamicTesting()
        );

        httpMock = TestBed.get(HttpTestingController);
        httpClient = TestBed.get(HttpClient);
    });

    afterEach(() => {
        getTestBed().resetTestEnvironment();
    });

    it("does not attach authorization header for unprotected resource", () => {
        httpClient.get("http://localhost/api").subscribe(response => expect(response).toBeTruthy());

        const request = httpMock.expectOne("http://localhost/api");
        request.flush({ data: "test" });
        expect(request.request.headers.get("Authorization")).toBeUndefined;
        httpMock.verify();
    });

    it("attaches authorization header with access token for protected resource", done => {
        spyOn(UserAgentApplication.prototype, "acquireTokenSilent").and.returnValue((
            new Promise((resolve) => {
                resolve({
                    accessToken: "access-token",
                    tokenType: ServerHashParamKeys.ACCESS_TOKEN
                });
            })
        ));

        httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
        setTimeout(() => {
            const request = httpMock.expectOne("https://graph.microsoft.com/v1.0/me");
            request.flush({ data: "test" });
            expect(request.request.headers.get("Authorization")).toEqual("Bearer access-token");
            httpMock.verify();
            done();
        }, 200);
    });

    it("attaches authorization header with id token for protected resource", done => {
        spyOn(UserAgentApplication.prototype, "acquireTokenSilent").and.returnValue((
            new Promise((resolve) => {
                resolve({
                    accessToken: "access-token",
                    idToken: {
                        rawIdToken: "id-token",
                    },
                    tokenType: ServerHashParamKeys.ID_TOKEN
                });
            })
        ));

        httpClient.get("https://graph.microsoft.com/v1.0/me").subscribe();
        setTimeout(() => {
            const request = httpMock.expectOne("https://graph.microsoft.com/v1.0/me");
            request.flush({ data: "test" });
            expect(request.request.headers.get("Authorization")).toEqual("Bearer id-token");
            httpMock.verify();
            done();
        }, 200);
    });
});
