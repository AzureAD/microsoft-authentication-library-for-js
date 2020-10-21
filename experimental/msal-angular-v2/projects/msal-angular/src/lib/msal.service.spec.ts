import { TestBed } from '@angular/core/testing';
import { AuthenticationResult, AuthError, InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MsalModule, MsalBroadcastService, MsalService } from '../public-api';

let authService: MsalService;
let broadcastService: MsalBroadcastService;

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
      redirectUri: 'http://localhost:4200'
    }
  });
}

function initializeMsal() {
  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    imports: [
      MsalModule.forRoot(MSALInstanceFactory(), null, { interactionType: InteractionType.Popup, protectedResourceMap: new Map() })
    ],
    providers: [
      MsalService,
      MsalBroadcastService
    ]
  });

  authService = TestBed.inject(MsalService);
  broadcastService = TestBed.inject(MsalBroadcastService);
}

describe('MsalService', () => {
  beforeAll(initializeMsal);
  afterAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.resetTestingModule();
    authService = null;
    broadcastService = null;
  });

  describe("loginPopup", () => {
    it("success", (done) => {
      const sampleIdToken = {
        idToken: "123abc"
      };

      spyOn(PublicClientApplication.prototype, "loginPopup").and.returnValue((
        new Promise((resolve) => {
          //@ts-ignore
          resolve(sampleIdToken);
        })
      ));

      const request = {
        scopes: ["user.read"]
      };

      authService.loginPopup(request)
        .subscribe((response: AuthenticationResult) => {
          expect(response.idToken).toBe(sampleIdToken.idToken);
          expect(PublicClientApplication.prototype.loginPopup).toHaveBeenCalledWith(request);
          done();
        });

    });

    it("failure", done => {
      const sampleError = new AuthError("123", "message");

      spyOn(PublicClientApplication.prototype, "loginPopup").and.returnValue((
        new Promise((resolve, reject) => {
          reject(sampleError);
        })
      ));

      const request = {
        scopes: ["wrong.scope"]
      };

      authService.loginPopup(request)
        .subscribe({
          error: (error: AuthError) => {
            expect(error.message).toBe(sampleError.message);
            expect(PublicClientApplication.prototype.loginPopup).toHaveBeenCalledWith(request);
            done();

          }
        });
    });


  });
});
