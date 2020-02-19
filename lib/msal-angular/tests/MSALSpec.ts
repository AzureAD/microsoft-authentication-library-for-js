import {BroadcastService, MsalService, MsalAngularConfiguration} from "../src";
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/proxy'; // since zone.js 0.6.15
import 'zone.js/dist/sync-test';
import 'zone.js/dist/jasmine-patch'; // put here since zone.js 0.6.14
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';
import {TestBed} from "@angular/core/testing";
import {getTestBed} from "@angular/core/testing";
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting
} from "@angular/platform-browser-dynamic/testing";
import {MSAL_CONFIG, MSAL_CONFIG_ANGULAR} from "../src/msal.service";
import {RouterTestingModule} from '@angular/router/testing';
import {} from 'jasmine';
import { Configuration, UserAgentApplication, AuthResponse, AuthError } from "msal";

describe('Msal Angular Pubic API tests', function () {

    let authService: MsalService;
    let broadcastService: BroadcastService;

    const clientId = "6226576d-37e9-49eb-b201-ec1eeb0029b6";

    beforeAll(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
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
                }
            ]
        });

        getTestBed().initTestEnvironment(
            BrowserDynamicTestingModule,
            platformBrowserDynamicTesting()
        );

        authService = TestBed.get(MsalService);
        broadcastService = TestBed.get(BroadcastService);
    });

    describe('loginPopup', () => {
        it('success', done => {
            const sampleIdToken = {
                idToken: "123abc"
            };

            spyOn(UserAgentApplication.prototype, 'loginPopup').and.returnValue((
                new Promise((resolve) => {
                    resolve(sampleIdToken);
                })
            ));

            broadcastService.subscribe("msal:loginSuccess", (payload: AuthResponse) => {
                expect(payload.idToken).toBe(sampleIdToken.idToken);

                done();
            });

            const request = {
                scopes: ["user.read"]
            };

            authService.loginPopup(request)
            .then((response: AuthResponse) => {
                expect(response.idToken).toBe(sampleIdToken.idToken);
            });

            expect(UserAgentApplication.prototype.loginPopup).toHaveBeenCalledWith(request);
        });

        it('failure', done => {
            const sampleError = new AuthError("123", "message");

            spyOn(UserAgentApplication.prototype, 'loginPopup').and.returnValue((
                new Promise((resolve, reject) => {
                    reject(sampleError);
                })
            ));

            broadcastService.subscribe("msal:loginFailure", (error: AuthError) => {
                expect(error.message).toBe(sampleError.message);
                done();
            });

            const request = {
                scopes: ["wrong.scope"]
            };

            authService.loginPopup(request)
            .catch((error: AuthError) => {
                expect(error.message).toBe(sampleError.message);
            });

            expect(UserAgentApplication.prototype.loginPopup).toHaveBeenCalledWith(request);
        });
    });

    describe('loginRedirect', () => {
        it('success', () => {
            spyOn(UserAgentApplication.prototype, 'loginRedirect');

            authService.loginRedirect({
                scopes: ["user.read"]
            });

            expect(UserAgentApplication.prototype.loginRedirect).toHaveBeenCalled();
        });
    });

    describe('acquireTokenSilent', () => {
        it('success', done => {
            const sampleAccessToken = {
                accessToken: "123abc"
            };

            spyOn(UserAgentApplication.prototype, 'acquireTokenSilent').and.returnValue((
                new Promise((resolve) => {
                    resolve(sampleAccessToken);
                })
            ));

            broadcastService.subscribe("msal:acquireTokenSuccess", (payload: any) => {
                expect(payload.accessToken).toBe(sampleAccessToken.accessToken);

                done();
            });

            const request = {
                scopes: ["user.read"]
            };

            authService.acquireTokenSilent(request)
            .then((response) => {
                expect(response.accessToken).toBe(sampleAccessToken.accessToken);
            });

            expect(UserAgentApplication.prototype.acquireTokenSilent).toHaveBeenCalledWith(request);
        });

        it('failure', function(done) {
            const sampleError = new AuthError("123", "message");

            spyOn(UserAgentApplication.prototype, 'acquireTokenSilent').and.returnValue((
                new Promise((resolve, reject) => {
                    reject(sampleError);
                })
            ));

            broadcastService.subscribe("msal:acquireTokenFailure", (error: AuthError) => {
                expect(error.message).toBe(sampleError.message);
                done();
            });

            const request = {
                scopes: ["wrong.scope"]
            };

            authService.acquireTokenSilent(request)
            .catch((error: AuthError) => {
                expect(error.message).toBe(sampleError.message);
            });

            expect(UserAgentApplication.prototype.acquireTokenSilent).toHaveBeenCalledWith(request);
        });
    });

    describe('acquireTokenRedirect', () => {
        it('success', () => {
            spyOn(UserAgentApplication.prototype, 'acquireTokenRedirect');

            authService.acquireTokenRedirect({
                scopes: ["user.read"]
            });

            expect(UserAgentApplication.prototype.acquireTokenRedirect).toHaveBeenCalled();
        });
    });

    describe('acquireTokenPopup', () => {
        it('success', done => {
            const sampleAccessToken = {
                accessToken: "123abc"
            };

            spyOn(UserAgentApplication.prototype, 'acquireTokenPopup').and.returnValue((
                new Promise((resolve) => {
                    resolve(sampleAccessToken);
                })
            ));

            broadcastService.subscribe("msal:acquireTokenSuccess", (payload: AuthResponse) => {
                expect(payload.accessToken).toBe(sampleAccessToken.accessToken);

                done();
            });

            const request = {
                scopes: ["user.read"]
            };

            authService.acquireTokenPopup(request)
            .then((response: AuthResponse) => {
                expect(response.accessToken).toBe(sampleAccessToken.accessToken);
            });

            expect(UserAgentApplication.prototype.acquireTokenPopup).toHaveBeenCalledWith(request);
        });

        it('failure', done => {
            const sampleError = new AuthError("123", "message");

            spyOn(UserAgentApplication.prototype, 'acquireTokenPopup').and.returnValue((
                new Promise((resolve, reject) => {
                    reject(sampleError);
                })
            ));

            broadcastService.subscribe("msal:acquireTokenFailure", (error: AuthError) => {
                expect(error.message).toBe(sampleError.message);
                done();
            });

            const request = {
                scopes: ["wrong.scope"]
            };

            authService.acquireTokenPopup(request)
            .catch((error: AuthError) => {
                expect(error.message).toBe(sampleError.message);
            });

            expect(UserAgentApplication.prototype.acquireTokenPopup).toHaveBeenCalledWith(request);
        });
    });

    describe("getScopesForEndpoint", () => {
        it("protected resource", () => {
            const scopes = authService.getScopesForEndpoint("https://graph.microsoft.com/v1.0/me");

            expect(scopes).toEqual([ "user.read" ]);
        });

        it("unprotected resource", () => {
            const scopes = authService.getScopesForEndpoint("https://google.com");

            expect(scopes).toBeNull;
        });

        it("not listed as protected or unprotected", () => {
            const scopes = authService.getScopesForEndpoint("https://microsoft.com");

            expect(scopes).toBeNull;
        });

        it("own domain", () => {
            const scopes = authService.getScopesForEndpoint("http://localhost:4200/api");

            expect(scopes).toEqual([ clientId ]);
        });
    });
});
