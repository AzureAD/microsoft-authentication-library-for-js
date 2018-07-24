import {BroadcastService, MsalService} from "../src";
import {Router, RouterModule} from "@angular/router";
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

class BroadcastServiceStub extends  BroadcastService
{

}

class RouterStub
{
    navigateByUrl(url: string) {
        return url;
    }
}

describe('start App', function() {

    let router :Router;
    let authService: MsalService;
    let broadcastService: BroadcastService;





    beforeAll( () => {

        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [MsalService, { provide: MSAL_CONFIG, useValue: { clientID: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
                    authority: "https://login.microsoftonline.com/microsoft.onmicrosoft.com/",
                    validateAuthority: true,
                    redirectUri: "http://localhost:4200/",
                    cacheLocation : "localStorage",
                    postLogoutRedirectUri: "http://localhost:4200/",
                    navigateToLoginRequestUrl: true,
                    popUp: false,
                    scopes: ["user.read", "mail.send"],
                    anonymousEndpoints: ["https:google.com"],
                    correlationId: '1234',
                    level: LogLevel.Verbose,
                    piiLoggingEnabled: true} } ,  BroadcastService,  {provide: Storage, useClass: {mockLocalStorage: "localStorage"}}]
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



        spyOn(authService, 'loginPopup').and.returnValues( () =>{

            this.broadcastService.broadcast("msal:loginSuccess", {});
            /*  return new Promise<string>((resolve, reject) => {

                  localStorage.setItem("neha", "test123");
                  resolve("123");
              });
  */
        });

        spyOn(authService, 'loginRedirect').and.returnValues( () =>{

            this.broadcastService.broadcast("msal:loginSuccess", {});


        });

        spyOn(broadcastService, 'broadcast').and.callThrough();



    } );




    it('test login_popup', () => {
        // expect(false).toBe(false);
        var idToken;
        authService.login_popup(["user.read"]).then( (idtoken) => {
            expect(idtoken).toBe(1234);
            this.idToken = idtoken;
            expect(localStorage.getItem('neha')).toEqual('test123');
        }).catch( (error) => {
            //expect(error).toBe(12345);
        });

        //  expect(this.idToken).toBe(123);
        expect(authService.loginPopup).toHaveBeenCalled();

        // expect(broadcastService.broadcast).toHaveBeenCalled();



        //expect(authService.get_user()).toHaveBeenCalled();

    });


    it('test login_redirect', () => {
        // expect(false).toBe(true);
        var idToken;
        authService.login_redirect(["user.read"]);

        expect(authService.loginRedirect).toHaveBeenCalled();

        broadcastService.subscribe("msal:loginSuccess", (payload: any) => {
            expect(broadcastService.broadcast).toHaveBeenCalled();
            expect(false).toBe(true);

        });


    });


    /*

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
    */






});
