import {
    BroadcastService,
    MsalService,
    MsalAngularConfiguration,
    MSAL_CONFIG,
    MSAL_CONFIG_ANGULAR
} from "../public_api";
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
import {RouterTestingModule} from '@angular/router/testing';
import {} from 'jasmine';
import { Configuration, UserAgentApplication, AuthResponse, AuthError, Account } from "msal";
import { RequestUtils } from "../../msal-core/src/utils/RequestUtils";
import { Constants, TemporaryCacheKeys } from "../../msal-core/src/utils/Constants";
import { testHashesForState, TEST_TOKENS } from "./TestConstants";
import { AuthCache } from "msal/src/cache/AuthCache";

let authService: MsalService;
let broadcastService: BroadcastService;

const clientId = "6226576d-37e9-49eb-b201-ec1eeb0029b6";

function initializeMsal() {
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
    })
    
    getTestBed().initTestEnvironment(
        BrowserDynamicTestingModule,
        platformBrowserDynamicTesting()
    );

    authService = TestBed.get(MsalService);
    broadcastService = TestBed.get(BroadcastService);
};

describe('Msal Angular Pubic API tests', function () {
    describe('login and acquireToken methods', () => {
        beforeAll(initializeMsal);
        afterAll(() => {
            TestBed.resetTestEnvironment();
            TestBed.resetTestingModule();
            authService = null;
            broadcastService = null;
        })

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

    });

    describe("getScopesForEndpoint", () => {
        beforeAll(initializeMsal);
        afterAll(() => {
            TestBed.resetTestEnvironment();
            TestBed.resetTestingModule();
            authService = null;
            broadcastService = null;
        });

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

    describe('handleRedirectCallback', () => {
        let TEST_LIBRARY_STATE: string;
        let TEST_NONCE: string;
        let TEST_USER_STATE_NUM: string;
        let cacheStorage: AuthCache;

        beforeAll(() => {
            TEST_USER_STATE_NUM = "1234"
            TEST_NONCE = "123523";
            TEST_LIBRARY_STATE = RequestUtils.generateLibraryState(Constants.interactionTypeRedirect);
            cacheStorage = new AuthCache(clientId, "localStorage", true);
        });
        afterEach(() => {
            TestBed.resetTestEnvironment();
            TestBed.resetTestingModule();
            authService = null;
            broadcastService = null;
            window.location.hash = ""
        });
        afterAll(() => {
            cacheStorage.clear();
        });

        it('success with token type id_token', done => {
            cacheStorage.setItem(`${TemporaryCacheKeys.STATE_LOGIN}|${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`, TEST_NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;
            initializeMsal();

            function redirectReturn(error: AuthError, response: AuthResponse){
                expect(response).toBeTruthy();
                expect(error).toBeNull();
            }

            broadcastService.subscribe("msal:loginSuccess", (response: AuthResponse) => {
                expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                expect(response.tokenType).toEqual('id_token');
                done();
            });

            authService.handleRedirectCallback(redirectReturn);
        });

        it('success with token type access_token', done => {
            cacheStorage.setItem(`${TemporaryCacheKeys.STATE_ACQ_TOKEN}|${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`, TEST_NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ACCESS_TOKEN_HASH + TEST_USER_STATE_NUM;
            initializeMsal();

            function redirectReturn(error: AuthError, response: AuthResponse){
                expect(response).toBeTruthy();
                expect(error).toBeNull();
            }

            broadcastService.subscribe("msal:acquireTokenSuccess", (response: AuthResponse) => {
                expect(response.accessToken).toEqual(TEST_TOKENS.ACCESSTOKEN);
                expect(response.tokenType).toEqual('access_token')
                done();
            });

            authService.handleRedirectCallback(redirectReturn);
        });

        it('failure with token type id_token', done => {
            cacheStorage.setItem(`${TemporaryCacheKeys.STATE_ACQ_TOKEN}|${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`, TEST_NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_ERROR_HASH + TEST_USER_STATE_NUM;
            initializeMsal();

            spyOn(UserAgentApplication.prototype, 'getAccount').and.returnValue((null));

            let expectedResponse : AuthResponse = {
                uniqueId: "",
                tenantId: "",
                tokenType: "",
                idToken: null,
                idTokenClaims: null,
                accessToken: "",
                scopes: null,
                expiresOn: null,
                account: null,
                accountState: TEST_USER_STATE_NUM,
                fromCache: false
            };

            function redirectReturn(error: AuthError, response: AuthResponse){
                expect(response).toBeTruthy();
                expect(response).toEqual(expectedResponse);
                expect(error).toBeTruthy();
            }

            broadcastService.subscribe("msal:loginFailure", (error: AuthError) => {
                expect(error.message).toEqual("msal error description")
                done();
            });

            authService.handleRedirectCallback(redirectReturn);
        });

        it('failure with token type access_token', done => {
            cacheStorage.setItem(`${TemporaryCacheKeys.STATE_ACQ_TOKEN}|${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`, TEST_NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_ERROR_HASH + TEST_USER_STATE_NUM;
            initializeMsal();

            const account: Account = new Account("test", "testHomeID", "testUser", "testName", {"testClaimKey": "testClaimVal"}, "testSID", "testEnv")

            spyOn(UserAgentApplication.prototype, 'getAccount').and.returnValue((
                account
            ));

            let expectedResponse : AuthResponse = {
                uniqueId: "",
                tenantId: "",
                tokenType: "",
                idToken: null,
                idTokenClaims: null,
                accessToken: "",
                scopes: null,
                expiresOn: null,
                account: null,
                accountState: TEST_USER_STATE_NUM,
                fromCache: false
            };

            function redirectReturn(error: AuthError, response: AuthResponse){
                expect(response).toBeTruthy();
                expect(response).toEqual(expectedResponse);
                expect(error).toBeTruthy();
            }

            broadcastService.subscribe("msal:acquireTokenFailure", (error: AuthError) => {
                expect(error.message).toEqual("msal error description")
                done();
            });

            authService.handleRedirectCallback(redirectReturn);
        });
    });
});