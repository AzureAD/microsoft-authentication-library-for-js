import {BroadcastService, MsalService} from "../src";
import {Router} from "@angular/router";
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
import {MSAL_CONFIG} from "../src/msal.service";
import { RouterTestingModule } from '@angular/router/testing';
import {LogLevel} from "../../msal-core/lib-commonjs";
import {Storage} from "../../msal-core/src/Storage";
import {} from 'jasmine';
import * as Promise from 'bluebird';
/*
class BroadcastServiceStub extends  BroadcastService
{

}

class RouterStub
{
    navigateByUrl(url: string) {
        return url;
    }
}
class MockSuccessAuthService
{

    MockSuccessAuthService()
    {

    }
    loginPopup(scopes: Array<string>, extraQueryParameters?: string): Promise<any> {

        return new Promise((resolve, reject) => {
            resolve("911");

        });
    }

}

class MockFailureAuthService
{
    MockFailureAuthService()
    {

    }

  public  loginPopup(scopes: Array<string>, extraQueryParameters?: string): Promise<any> {

        return new Promise((resolve, reject) => {
            reject("911");

        });
    }

}
*/
describe('Msal Angular Pubic API tests', function() {

  //  let router :Router;
    let authService: MsalService;
    let broadcastService: BroadcastService;





    beforeAll( () => {

        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [ MsalService, { provide: MSAL_CONFIG, useValue: {
                //clientID: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
                    authority: "https://login.microsoftonline.com/microsoft.onmicrosoft.com/",
                    validateAuthority: true,
                    redirectUri: "http://localhost:4200/",
                    cacheLocation : "localStorage",
                    postLogoutRedirectUri: "http://localhost:4200/",
                    navigateToLoginRequestUrl: true,
                    popUp: false,
                    consentScopes: ["user.read", "mail.send"],
                    unprotectedResources: ["https:google.com"],
                    correlationId: '1234',
                    level: LogLevel.Verbose,
                    piiLoggingEnabled: true} } ,  BroadcastService,  {provide: Storage, useClass: {mockLocalStorage: "localStorage"}}
            ]
        })

/*
        let store = {};
        const mockLocalStorage = {
            getItem: (key: string): string => {
                return key in store ? store[key] : null;
            },
            setItem: (key: string, value: string) => {
                store[key] = `${value}`;
            },
            removeItem: (key: string) => {
                delete store[key];
            },
            clear: () => {
                store = {};
            }
        };

        spyOn(window.localStorage, 'getItem')
            .and.callFake(mockLocalStorage.getItem());

        spyOn(window.localStorage, 'setItem')
            .and.callFake(mockLocalStorage.setItem);

        spyOn(Storage.prototype, 'removeItem')
            .and.callFake(mockLocalStorage.removeItem);

        spyOn(Storage.prototype, 'clear')
            .and.callFake(mockLocalStorage.clear);
*/
        getTestBed().initTestEnvironment(
            BrowserDynamicTestingModule,
            platformBrowserDynamicTesting()
        );

     //   spyOn(Engine.prototype, 'getHorsepower').and.returnValue(400);



        var store = {};


        spyOn(localStorage, 'getItem').and.callFake((key: any)=> {
            return store[key];
        });
        spyOn(localStorage, 'setItem').and.callFake( (key: any, value: any) =>{
            return store[key] = value + '';
        });
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
        authService = TestBed.get(MsalService);

        broadcastService = TestBed.get(BroadcastService);

      /*  const pMock1 = new Promise((resolve, reject) => {
           // resolve("911");
             reject("invalid scopes");
        });

        spyOn(authService, 'loginPopup').and.returnValue(pMock1);
*/


//        spyOn(authService, 'loginPopup').and.returnValues(Observable.of(true));
      /*  spyOn(authService, 'loginPopup').and.returnValues( () =>{

            this.broadcastService.broadcast("msal:loginSuccess", {});
          //  return new Promise<string>((resolve, reject) => {

            //    localStorage.setItem("neha", "test123");
              //  resolve("123");
           // });

        });
*/
      //  logIn: jasmine.createSpy('logIn').and.returnValue(Observable.of(true))

        /*
       const pMock = new Promise((resolve, reject) => {
            resolve("911");
            // or reject("failure reason");
        });

        spyOn(authService, 'loginRedirect').and.returnValue(pMock);
*/
/*        spyOn(authService, 'loginPopup')
            .and.callFake(MockSuccessAuthService.loginPopup);
*/
       // spyOn(authService, 'loginRedirect').and.returnValues(Observable.of(true));
            /*  spyOn(authService, 'loginRedirect').and.returnValues( () =>{

                    this.broadcastService.broadcast("msal:loginSuccess", {});


              });
      */
      //  spyOn(broadcastService, 'broadcast').and.callThrough();



    } );



        const pSuccessPromise = new Promise((resolve, reject) => {
            resolve("911");

        });



    it('test login_popup success', () => {
        spyOn(authService, 'loginPopup').and.returnValue(pSuccessPromise);
        authService.login_popup(["user.read"]).then( (idtoken) => {
          expect(idtoken).toBe('911');
        }).catch( (error) => {
            //This should not get executed for success case. If it does, something is wrong. Fix it.
            expect(true).toBe(false);
        });
     expect(authService.loginPopup).toHaveBeenCalled();
        broadcastService.subscribe("msal:loginSuccess", (payload: any) => {
            expect(payload.idToken).toBe('911');
        });
    });


    it('test login_popup failure', () => {
        // expect(false).toBe(true);

        const pMock1 = new Promise((resolve, reject) => {
           // resolve("911");
            reject("invalid scopes");
        });

        spyOn(authService, 'loginPopup').and.returnValue(pMock1);


        var idToken;
        authService.login_popup(["user.read"]).then((idtoken) => {
            expect(idtoken).toBe(911);
            //this.idToken = idtoken;
            // expect(localStorage.getItem('neha')).toEqual('test123');
        }).catch((error) => {
            expect(error).toBe("error | invalid scopes");
        });

        expect(authService.loginPopup).toHaveBeenCalled();

    });


it('test login_redirect success', () => {
    const pMock1 = new Promise((resolve, reject) => {
        resolve("911");
        //reject("invalid scopes");
    });

    spyOn(authService, 'loginRedirect').and.returnValue(pMock1);

    // expect(false).toBe(true);
        var idToken;
        authService.login_redirect(["user.read"]);

        expect(authService.loginRedirect).toHaveBeenCalled();

        broadcastService.subscribe("msal:loginSuccess", (payload: any) => {
           // expect(broadcastService.broadcast).toHaveBeenCalled();
            expect(payload.idToken).toBe('911');

        });


    });


    it('test login_redirect failure', () => {
        const pMock1 = new Promise((resolve, reject) => {
            //resolve("911");
            reject("invalid scopes");
        });

        spyOn(authService, 'loginRedirect').and.returnValue(pMock1);

        // expect(false).toBe(true);
        var idToken;
        authService.login_redirect(["user.read"]);

        expect(authService.loginRedirect).toHaveBeenCalled();

        broadcastService.subscribe("msal:loginFailure", (payload: any) => {
            // expect(broadcastService.broadcast).toHaveBeenCalled();
            expect(payload.error).toBe('invalid scopes');

        });


    });

    it('test acquire_token_silent failure', () => {
        const pMock1 = new Promise((resolve, reject) => {
            //resolve("911");
            reject("invalid scopes");
        });

        spyOn(authService, 'acquireTokenSilent').and.returnValue(pMock1);

        // expect(false).toBe(true);
        var idToken;
        authService.acquire_token_silent(["user.read"]).then(  (error) =>
        {
            expect(true).toBe(false);
          expect(error).toBe("invalid scopes");
        })



        expect(authService.acquireTokenSilent).toHaveBeenCalled();

        broadcastService.subscribe("msal:acquireTokenFailure", (payload: any) => {
            // expect(broadcastService.broadcast).toHaveBeenCalled();
           // expect(true).toBe(false);
            expect(payload).toBe('invalid scopes' );

        });


    });

    it('test acquire_token_silent success', () => {
        const pMock1 = new Promise((resolve, reject) => {
            resolve("911");
            //reject("invalid scopes");
        });

        spyOn(authService, 'acquireTokenSilent').and.returnValue(pMock1);

        // expect(false).toBe(true);
        var idToken;
        authService.acquire_token_silent(["user.read"]).then(  (error) =>
        {
           // expect(true).toBe(false);
            expect(error).toBe('911');
        })



        expect(authService.acquireTokenSilent).toHaveBeenCalled();

        broadcastService.subscribe("msal:acquireTokenSuccess", (payload: any) => {
            // expect(broadcastService.broadcast).toHaveBeenCalled();
            // expect(true).toBe(false);
            expect(payload).toBe('911' );

        });


    });

    it('test acquire_token_redirect failure', () => {
        const pMock1 = new Promise((resolve, reject) => {
            //resolve("911");
            reject("invalid scopes");
        });

        spyOn(authService, 'acquireTokenRedirect').and.returnValue(pMock1);

        // expect(false).toBe(true);
        var idToken;
        authService.acquire_token_redirect(["user.read"]);


        expect(authService.acquireTokenRedirect).toHaveBeenCalled();

        broadcastService.subscribe("msal:acquireTokenFailure", (payload: any) => {
            // expect(broadcastService.broadcast).toHaveBeenCalled();
            // expect(true).toBe(false);
            expect(payload).toBe('invalid scopes' );

        });


    });

    it('test acquire_token_redirect success', () => {
        const pMock1 = new Promise((resolve, reject) => {
            resolve("911");
            //reject("invalid scopes");
        });

        spyOn(authService, 'acquireTokenRedirect').and.returnValue(pMock1);

        // expect(false).toBe(true);
        var idToken;
        authService.acquire_token_redirect(["user.read"]);



        expect(authService.acquireTokenRedirect).toHaveBeenCalled();

        broadcastService.subscribe("msal:acquireTokenSuccess", (payload: any) => {
            // expect(broadcastService.broadcast).toHaveBeenCalled();
            // expect(true).toBe(false);
            expect(payload).toBe('911' );

        });


    });

    it('test acquire_token_popup failure', () => {
        const pMock1 = new Promise((resolve, reject) => {
            //resolve("911");
            reject("invalid scopes");
        });

        spyOn(authService, 'acquireTokenPopup').and.returnValue(pMock1);

        // expect(false).toBe(true);
        var idToken;
        authService.acquire_token_popup(["user.read"]);


        expect(authService.acquireTokenPopup).toHaveBeenCalled();

        broadcastService.subscribe("msal:acquireTokenFailure", (payload: any) => {
            // expect(broadcastService.broadcast).toHaveBeenCalled();
            // expect(true).toBe(false);
            expect(payload).toBe('invalid scopes' );

        });


    });

    it('test acquire_token_popup success', () => {
        const pMock1 = new Promise((resolve, reject) => {
            resolve("911");
            //reject("invalid scopes");
        });

        spyOn(authService, 'acquireTokenPopup').and.returnValue(pMock1);

        // expect(false).toBe(true);
        var idToken;
        authService.acquire_token_popup(["user.read"]).then(  (payload) =>
        {
           // expect(true).toBe(false);
            expect(payload).toBe("911");
        })





        expect(authService.acquireTokenPopup).toHaveBeenCalled();

        broadcastService.subscribe("msal:acquireTokenSuccess", (payload: any) => {
            // expect(broadcastService.broadcast).toHaveBeenCalled();
          //  expect(true).toBe(false);
            expect(payload).toBe('911' );

        });


    });


    it('test login success for login popup', () => {
            expect(false).toBe(false);
        });

        it('test login failure for login popup', () => {
            expect(false).toBe(false);
        });

        it('test login success for login redirect', () => {
            expect(false).toBe(false);
        });

        it('test login failure for login redirect', () => {
            expect(false).toBe(false);
        });

        it('test acquire token success acquire_token_silent', () => {
            expect(false).toBe(false);
        });

        it('test acquire token failure acquire_token_silent', () => {
            expect(false).toBe(false);
        });

        it('test acquire token success acquire_token_popup', () => {
            expect(false).toBe(false);
        });

        it('test acquire token failure acquire_token_popup', () => {
            expect(false).toBe(false);
        });







});
