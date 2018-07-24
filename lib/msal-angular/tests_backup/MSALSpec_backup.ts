import {BroadcastService, MsalGuard, MsalService} from "../src";
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/proxy'; // since zone.js 0.6.15
import 'zone.js/dist/sync-test';
import 'zone.js/dist/jasmine-patch'; // put here since zone.js 0.6.14
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';
import {async, TestBed} from "@angular/core/testing";
import {getTestBed} from "@angular/core/testing";
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting
} from "@angular/platform-browser-dynamic/testing";
import {MSAL_CONFIG} from "../src/msal.service";
import {RouterTestingModule} from '@angular/router/testing';
import {LogLevel} from "../../msal-core/lib-commonjs";
import {Storage} from "../../msal-core/src/Storage";
import {} from 'jasmine';
import { inject} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {HTTP_INTERCEPTORS, HttpClient} from '@angular/common/http';

import {MsalInterceptor} from '../src/msal.interceptor';
import {DataService} from "./DataService";
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from "@angular/router";

describe('Msal Angular Pubic API tests', function () {

    class MockActivatedRouteSnapshot {
        private _data: any;
        get data(){
            return this._data;
        }
    }

    class MockRouterStateSnapshot {
        private _data: any;
        get data(){
            return this._data;
        }
    }

    let authService: MsalService;
    let broadcastService: BroadcastService;
    let msalGuard: MsalGuard;
    let route: ActivatedRouteSnapshot;
    let routerStateSnapshot: RouterStateSnapshot;


    beforeAll(() => {

        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [MsalService,MsalGuard, {
                provide: MSAL_CONFIG, useValue: {
                    clientID: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
                    authority: "https://login.microsoftonline.com/microsoft.onmicrosoft.com/",
                    validateAuthority: true,
                    redirectUri: "http://localhost:4200/",
                    cacheLocation: "localStorage",
                    postLogoutRedirectUri: "http://localhost:4200/",
                    navigateToLoginRequestUrl: true,
                    popUp: false,
                    consentScopes: ["user.read", "mail.send"],
                    unprotectedResources: ["https:google.com"],
                    correlationId: '1234',
                    level: LogLevel.Verbose,
                    piiLoggingEnabled: true
                }
            }, BroadcastService, {provide: Storage, useClass: {mockLocalStorage: "localStorage"}} ,                 {
                provide: ActivatedRouteSnapshot,
                useClass: MockActivatedRouteSnapshot
            },
                {
                    provide: RouterStateSnapshot,
                    useClass: MockRouterStateSnapshot}

            ]
        })

        getTestBed().initTestEnvironment(
            BrowserDynamicTestingModule,
            platformBrowserDynamicTesting()
        );


        var store = {};

        spyOn(localStorage, 'getItem').and.callFake((key: any) => {
            return store[key];
        });
        spyOn(localStorage, 'setItem').and.callFake((key: any, value: any) => {
            return store[key] = value + '';
        });
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
        authService = TestBed.get(MsalService);
        broadcastService = TestBed.get(BroadcastService);
        msalGuard = TestBed.get(MsalGuard);
        route = TestBed.get(ActivatedRouteSnapshot);
        routerStateSnapshot = TestBed.get(RouterStateSnapshot);

    });

    const pSuccessPromise = new Promise((resolve, reject) => {
        resolve("911");
    });

    const pFailurePromise = new Promise((resolve, reject) => {
        reject("invalid scopes");
    });

    it('test login_popup success', () => {
        const pSuccessPromise = new Promise((resolve, reject) => {
            resolve("login_popup_success");
        });
        spyOn(authService, 'loginPopup').and.returnValue(pSuccessPromise);
        authService.login_popup(["user.read"]).then((idtoken) => {
            expect(idtoken).toBe('login_popup_success');
        }).catch((error) => {
            //This should not get executed for success case. If it does, something is wrong. Fix it.
            expect(true).toBe(false);
        });
        expect(authService.loginPopup).toHaveBeenCalled();
        broadcastService.subscribe("msal:loginSuccess", (payload: any) => {
            expect(payload.idToken).toBe('login_popup_success');
        });

    });

    it('test login_popup failure', () => {
        spyOn(authService, 'loginPopup').and.returnValue(pFailurePromise);
        authService.login_popup(["wrong.scope"]).then((idtoken) => {
            //This should not get executed for success case. If it does, something is wrong. Fix it.
            expect(true).toBe(false);
        }).catch((error) => {
            expect(error).toEqual(["invalid scopes"]);
        });
        expect(authService.loginPopup).toHaveBeenCalled();


        broadcastService.subscribe("msal:loginFailure", (payload: any) => {
            expect(payload.errorParts).toEqual(["invalid scopes"]);
        });
    });


    it('test login_redirect success', () => {
        spyOn(authService, 'loginRedirect').and.returnValue(pSuccessPromise);
        authService.login_redirect(["user.read"]);
        expect(authService.loginRedirect).toHaveBeenCalled();
        //can't test broadcast in unit test. Can be tested only in endToEnd test
    });


    it('test login_redirect failure', () => {
        spyOn(authService, 'loginRedirect').and.returnValue(pFailurePromise);
        authService.login_redirect(["wrong.scope"]);
        expect(authService.loginRedirect).toHaveBeenCalled();
        //can't test broadcast in unit test. Can be tested only in endToEnd test
    });

    it('test acquire_token_silent success', () => {
        spyOn(authService, 'acquireTokenSilent').and.returnValue(pSuccessPromise);
        authService.acquire_token_silent(["user.read"]).then((error) => {
            expect(error).toBe('911');
        }).catch((error) => {
            //This should not get executed for success case. If it does, something is wrong. Fix it.
            expect(true).toBe(false);
        });
        expect(authService.acquireTokenSilent).toHaveBeenCalled();

        broadcastService.subscribe("msal:acquireTokenSuccess", (payload: any) => {
            expect(payload).toBe('911');
        });

    });

    it('test acquire_token_silent failure', () => {
        spyOn(authService, 'acquireTokenSilent').and.returnValue(pFailurePromise);
        authService.acquire_token_silent(["wrong.scope"]).then((payloaf) => {
            //This should not get executed for success case. If it does, something is wrong. Fix it.
            expect(true).toBe(false);
        }).catch((error) => {
            expect(error).toEqual(["invalid scopes"]);
        });
        expect(authService.acquireTokenSilent).toHaveBeenCalled();

        broadcastService.subscribe("msal:acquireTokenFailure", (payload: any) => {
            expect(payload).toEqual(["invalid scopes"]);
        });
    });

    it('test acquire_token_redirect success', () => {
        spyOn(authService, 'acquireTokenRedirect').and.returnValue(pSuccessPromise);
        authService.acquire_token_redirect(["user.read"]);
        expect(authService.acquireTokenRedirect).toHaveBeenCalled();
    });

    it('test acquire_token_redirect failure', () => {
        spyOn(authService, 'acquireTokenRedirect').and.returnValue(pFailurePromise);
        authService.acquire_token_redirect(["wrong.scope"]);
        expect(authService.acquireTokenRedirect).toHaveBeenCalled();
    });


    it('test acquire_token_popup success', () => {
        spyOn(authService, 'acquireTokenPopup').and.returnValue(pSuccessPromise);
        authService.acquire_token_popup(["user.read"]).then((payload) => {
            expect(payload).toBe('911');
        }).catch((error) => {
            //This should not get executed for success case. If it does, something is wrong. Fix it.
            expect(true).toBe(false);
        });
        expect(authService.acquireTokenPopup).toHaveBeenCalled();

        broadcastService.subscribe("msal:acquireTokenSuccess", (payload: any) => {
            expect(payload).toBe('911');
        });
    });

    it('test acquire_token_popup failure', () => {
        spyOn(authService, 'acquireTokenPopup').and.returnValue(pFailurePromise);
        authService.acquire_token_popup(["user.read"]).then((payload) => {
            //This should not get executed for success case. If it does, something is wrong. Fix it.
            expect(true).toBe(false);
        }).catch((error) => {
            expect(error).toEqual(["invalid scopes"]);
        });
        expect(authService.acquireTokenPopup).toHaveBeenCalled();

        broadcastService.subscribe("msal:acquireTokenFailure", (payload: any) => {
            expect(payload).toEqual(['invalid scopes']);
        });

    });

    it('be able to hit route when user is logged in', () => {
        authService.setIsAuthenticated(true);

        spyOn(authService, 'get_logger').and.callFake(() => {

        });

        //  this.authService._oauthData = {isAuthenticated: true, userName: "neha", loginError: "", idToken: {}};
        // this.authService._oauthData.userName = "neha";
        expect(msalGuard.canActivate(route, routerStateSnapshot)).toBe(true);

        expect(authService.get_logger).toHaveBeenCalled();
    });

    it('not be able to hit route when user is not logged in', () => {
        authService.setIsAuthenticated(false);

        spyOn(authService, 'get_logger').and.callFake(() => {

        });
        // this.authService._oauthData = {isAuthenticated: false, userName: "", loginError: "", idToken: {}};
        //  this.authService._oauthData.userName= "";
        expect(msalGuard.canActivate(route, routerStateSnapshot));
        expect(authService.get_logger).toHaveBeenCalled();
    });


});


/*

describe('Lang-interceptor.service', () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: [HttpClientTestingModule, RouterTestingModule],


        providers: [MsalService, DataService ,{
            provide: MSAL_CONFIG, useValue: {
                clientID: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
                authority: "https://login.microsoftonline.com/microsoft.onmicrosoft.com/",
                validateAuthority: true,
                redirectUri: "http://localhost:4200/",
                cacheLocation: "localStorage",
                postLogoutRedirectUri: "http://localhost:4200/",
                navigateToLoginRequestUrl: true,
                popUp: false,
                consentScopes: ["user.read", "mail.send"],
                unprotectedResources: ["https:google.com"],
                correlationId: '1234',
                level: LogLevel.Verbose,
                piiLoggingEnabled: true
            }
        }, BroadcastService, {provide: Storage, useClass: {mockLocalStorage: "localStorage"}  }, {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true
        }
        ]
    }));

    describe('intercept HTTP requests', () => {
        it('should add Accept-Language to Headers', inject([HttpClient, HttpTestingController],
            (http: HttpClient, mock: HttpTestingController) => {

                http.get('https://api.github.com/users').subscribe(response => expect(response).toBeTruthy());
                const request = mock.expectOne(req => (req.headers.has('Authorization')) );

                request.flush({data: 'test'});
                mock.verify();
            }));
    });

    afterEach(inject([HttpTestingController], (mock: HttpTestingController) => {
        mock.verify();
    }));
});

*/
/*
describe('Logged in guard should', () => {
    class MockActivatedRouteSnapshot {
        private _data: any;
        get data(){
            return this._data;
        }
    }

    class MockRouterStateSnapshot {
        private _data: any;
        get data(){
            return this._data;
        }
    }


    let msalGuard: MsalGuard;
    let authService: MsalService;
    let route: ActivatedRouteSnapshot;
    let routerStateSnapshot: RouterStateSnapshot;
    // async beforeEach
   // beforeEach(async(() => {
    beforeAll(() => {

        TestBed.configureTestingModule({

            imports: [RouterTestingModule],
            providers: [MsalGuard, MsalService,

                {
                    provide: MSAL_CONFIG, useValue: {
                        clientID: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
                        authority: "https://login.microsoftonline.com/microsoft.onmicrosoft.com/",
                        validateAuthority: true,
                        redirectUri: "http://localhost:4200/",
                        cacheLocation: "localStorage",
                        postLogoutRedirectUri: "http://localhost:4200/",
                        navigateToLoginRequestUrl: true,
                        popUp: false,
                        consentScopes: ["user.read", "mail.send"],
                        unprotectedResources: ["https:google.com"],
                        correlationId: '1234',
                        level: LogLevel.Verbose,
                        piiLoggingEnabled: true
                    }},
                //{provide: Router, useValue: router},
                {
                    provide: ActivatedRouteSnapshot,
                    useClass: MockActivatedRouteSnapshot
                },
                {
                    provide: RouterStateSnapshot,
                    useClass: MockRouterStateSnapshot
                }, BroadcastService
            ]
        })
          //  .compileComponents(); // compile template and css


        msalGuard = TestBed.get(MsalGuard);
        authService = TestBed.get(MsalService);
        route = TestBed.get(ActivatedRouteSnapshot);
        routerStateSnapshot = TestBed.get(RouterStateSnapshot);

        spyOn(authService, 'get_logger').and.callFake(() => {

        });

    });




    // synchronous beforeEach
    beforeEach(() => {

    });

    it('be able to hit route when user is logged in', () => {
        authService.setIsAuthenticated(true);
     //  this.authService._oauthData = {isAuthenticated: true, userName: "neha", loginError: "", idToken: {}};
       // this.authService._oauthData.userName = "neha";
        expect(msalGuard.canActivate(route, routerStateSnapshot)).toBe(true);

        expect(authService.get_logger).toHaveBeenCalled();
    });

    it('not be able to hit route when user is not logged in', () => {
        authService.setIsAuthenticated(false);
       // this.authService._oauthData = {isAuthenticated: false, userName: "", loginError: "", idToken: {}};
      //  this.authService._oauthData.userName= "";
        expect(msalGuard.canActivate(route, routerStateSnapshot)).toBe(false);
    });
});
*/