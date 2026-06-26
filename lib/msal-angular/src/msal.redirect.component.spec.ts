import { TestBed } from "@angular/core/testing";
import {
  IPublicClientApplication,
  PublicClientApplication,
} from "@azure/msal-browser";
import { MsalBroadcastService } from "./msal.broadcast.service";
import { MsalModule } from "./msal.module";
import { MsalRedirectComponent } from "./msal.redirect.component";
import { MsalService } from "./msal.service";
import { MsalGuardConfiguration } from "./msal.guard.config";
import { MsalInterceptorConfiguration } from "./msal.interceptor.config";

let authService: MsalService;
let broadcastService: MsalBroadcastService;

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: "0845a021-afdf-4126-abdd-099c5e6948e1",
      redirectUri: "http://localhost:4200",
    },
  });
}

function initializeMsal() {
  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    declarations: [MsalRedirectComponent],
    imports: [MsalModule.forRoot(MSALInstanceFactory(), null as unknown as MsalGuardConfiguration, null as unknown as MsalInterceptorConfiguration)],
    providers: [],
    teardown: { destroyAfterEach: false },
  });

  authService = TestBed.inject(MsalService);
  broadcastService = TestBed.inject(MsalBroadcastService);
}

describe("MsalRedirectComponent", () => {
  beforeEach(initializeMsal);

  it("calls handleRedirectObservable on ngInit", (done) => {
    const sampleAccessToken = {
      accessToken: "123abc",
    };

    spyOn(
      PublicClientApplication.prototype,
      "handleRedirectPromise"
    ).and.callFake(() => {
      return new Promise((resolve) => {
        console.log("Spy called");
        //@ts-ignore
        resolve(sampleAccessToken);

        expect(
          PublicClientApplication.prototype.handleRedirectPromise
        ).toHaveBeenCalled();
        done();
      });
    });

    const component = new MsalRedirectComponent(authService);
    component.ngOnInit();
  });
});
