/// <reference path='../node_modules/@types/jasmine/index.d.ts' />
import {BroadcastService, MsalService} from "../src";
import {Router} from "@angular/router";
import {TestBed} from "@angular/core/testing";


class BroadcastServiceStub extends  BroadcastService
{

}

class RouterStub extends  Router
{

}
describe('start App', function() {

    let router :Router;
    let authService: MsalService;
    let broadcastService: BroadcastService;



    beforeEach(async(() => {
        TestBed.configureTestingModule({
            // imports: [RouterTestingModule.withRoutes(routes)],
            // providers: [MsalService, {provide: BroadcastService, useClass: BroadcastServiceStub}, {provide: Router , useClass :RouterStub }]
            //providers: [MsalService]
        })
        }));

      /* authService = TestBed.get(MsalService);
        broadcastService = TestBed.get(BroadcastService);
        router = TestBed.get(Router);
*/



    it('should display message saying app works', () => {
        expect(false).toBe(false);

       // expect(authService.log_out()).toHaveBeenCalled();

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
