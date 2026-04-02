import { TestBed } from "@angular/core/testing";
import {
  AuthenticationResult,
  AuthError,
  InteractionStatus,
  InteractionType,
  Logger,
  PublicClientApplication,
  SilentRequest,
} from "@azure/msal-browser";
import { MsalModule, MsalBroadcastService, MsalService } from "./public-api";
import { takeLast } from "rxjs/operators";

let authService: MsalService;
let broadcastService: MsalBroadcastService;

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "0845a021-afdf-4126-abdd-099c5e6948e1",
    redirectUri: "http://localhost:4200",
  },
});

function initializeMsal() {
  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    imports: [
      MsalModule.forRoot(msalInstance, null, {
        interactionType: InteractionType.Popup,
        protectedResourceMap: new Map(),
      }),
    ],
    providers: [MsalService, MsalBroadcastService],
    teardown: { destroyAfterEach: false },
  });

  authService = TestBed.inject(MsalService);
  broadcastService = TestBed.inject(MsalBroadcastService);
}

describe("MsalService", () => {
  beforeEach(initializeMsal);

  describe("loginPopup", () => {
    it("success", (done) => {
      const sampleIdToken = {
        idToken: "123abc",
      };

      spyOn(PublicClientApplication.prototype, "loginPopup").and.returnValue(
        new Promise((resolve) => {
          //@ts-ignore
          resolve(sampleIdToken);
        })
      );

      const request = {
        scopes: ["user.read"],
      };

      authService
        .loginPopup(request)
        .subscribe((response: AuthenticationResult) => {
          expect(response.idToken).toBe(sampleIdToken.idToken);
          expect(
            PublicClientApplication.prototype.loginPopup
          ).toHaveBeenCalledWith(request);
          done();
        });
    });

    it("failure", (done) => {
      const sampleError = new AuthError("123", "message");

      spyOn(PublicClientApplication.prototype, "loginPopup").and.returnValue(
        new Promise((resolve, reject) => {
          reject(sampleError);
        })
      );

      const request = {
        scopes: ["wrong.scope"],
      };

      authService.loginPopup(request).subscribe({
        error: (error: AuthError) => {
          expect(error.message).toBe(sampleError.message);
          expect(
            PublicClientApplication.prototype.loginPopup
          ).toHaveBeenCalledWith(request);
          done();
        },
      });
    });
  });

  describe("loginRedirect", () => {
    it("success", async () => {
      spyOn(PublicClientApplication.prototype, "loginRedirect").and.returnValue(
        new Promise((resolve) => {
          resolve();
        })
      );

      const request = {
        scopes: ["user.read"],
      };

      await authService.loginRedirect(request);

      expect(
        PublicClientApplication.prototype.loginRedirect
      ).toHaveBeenCalled();
    });
  });

  describe("logoutPopup", () => {
    it("calls logoutPopup on msalService", async () => {
      spyOn(PublicClientApplication.prototype, "logoutPopup").and.returnValue(
        new Promise((resolve) => {
          resolve();
        })
      );
      await authService.logoutPopup();
      expect(PublicClientApplication.prototype.logoutPopup).toHaveBeenCalled();
    });
  });

  describe("logoutRedirect", () => {
    it("calls logoutRedirect on msalService", async () => {
      spyOn(
        PublicClientApplication.prototype,
        "logoutRedirect"
      ).and.returnValue(
        new Promise((resolve) => {
          resolve();
        })
      );
      await authService.logoutRedirect();
      expect(
        PublicClientApplication.prototype.logoutRedirect
      ).toHaveBeenCalled();
    });
  });

  describe("ssoSilent", () => {
    it("success", (done) => {
      const sampleIdToken = {
        idToken: "id-token",
      };

      spyOn(PublicClientApplication.prototype, "ssoSilent").and.returnValue(
        new Promise((resolve) => {
          //@ts-ignore
          resolve(sampleIdToken);
        })
      );

      const request = {
        scopes: ["user.read"],
        loginHint: "name@example.com",
      };

      authService
        .ssoSilent(request)
        .subscribe((response: AuthenticationResult) => {
          expect(response.idToken).toBe(sampleIdToken.idToken);
          expect(
            PublicClientApplication.prototype.ssoSilent
          ).toHaveBeenCalledWith(request);
          done();
        });
    });

    it("failure", (done) => {
      const sampleError = new AuthError("123", "message");

      spyOn(PublicClientApplication.prototype, "ssoSilent").and.returnValue(
        new Promise((resolve, reject) => {
          reject(sampleError);
        })
      );

      const request = {
        scopes: ["user.read"],
        loginHint: "name@example.com",
      };

      authService.ssoSilent(request).subscribe({
        error: (error: AuthError) => {
          expect(error.errorMessage).toBe(sampleError.errorMessage);
          expect(
            PublicClientApplication.prototype.ssoSilent
          ).toHaveBeenCalledWith(request);
          done();
        },
      });
    });
  });

  describe("acquireTokenSilent", () => {
    it("success", (done) => {
      const sampleAccessToken = {
        accessToken: "123abc",
      };

      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve) => {
          //@ts-ignore
          resolve(sampleAccessToken);
        })
      );

      const request: SilentRequest = {
        scopes: ["user.read"],
        account: null,
      };

      authService
        .acquireTokenSilent(request)
        .subscribe((response: AuthenticationResult) => {
          expect(response.accessToken).toBe(sampleAccessToken.accessToken);
          expect(
            PublicClientApplication.prototype.acquireTokenSilent
          ).toHaveBeenCalledWith(request);
          done();
        });
    });

    it("failure", (done) => {
      const sampleError = new AuthError("123", "message");

      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenSilent"
      ).and.returnValue(
        new Promise((resolve, reject) => {
          reject(sampleError);
        })
      );

      const request: SilentRequest = {
        scopes: ["wrong.scope"],
        account: null,
      };

      authService.acquireTokenSilent(request).subscribe({
        error: (error: AuthError) => {
          expect(error.errorMessage).toBe(sampleError.errorMessage);
          expect(
            PublicClientApplication.prototype.acquireTokenSilent
          ).toHaveBeenCalledWith(request);
          done();
        },
      });
    });
  });

  describe("acquireTokenRedirect", () => {
    it("success", async () => {
      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenRedirect"
      ).and.returnValue(
        new Promise((resolve) => {
          resolve();
        })
      );

      await authService.acquireTokenRedirect({
        scopes: ["user.read"],
      });

      expect(
        PublicClientApplication.prototype.acquireTokenRedirect
      ).toHaveBeenCalled();
    });
  });

  describe("acquireTokenPopup", () => {
    it("success", (done) => {
      const sampleAccessToken = {
        accessToken: "123abc",
      };

      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenPopup"
      ).and.returnValue(
        new Promise((resolve) => {
          //@ts-ignore
          resolve(sampleAccessToken);
        })
      );

      const request = {
        scopes: ["user.read"],
      };

      authService
        .acquireTokenPopup(request)
        .subscribe((response: AuthenticationResult) => {
          expect(response.accessToken).toBe(sampleAccessToken.accessToken);
          expect(
            PublicClientApplication.prototype.acquireTokenPopup
          ).toHaveBeenCalledWith(request);
          done();
        });
    });

    it("failure", (done) => {
      const sampleError = new AuthError("123", "message");

      spyOn(
        PublicClientApplication.prototype,
        "acquireTokenPopup"
      ).and.returnValue(
        new Promise((resolve, reject) => {
          reject(sampleError);
        })
      );

      const request = {
        scopes: ["wrong.scope"],
      };

      authService.acquireTokenPopup(request).subscribe({
        error: (error: AuthError) => {
          expect(error.errorMessage).toBe(sampleError.errorMessage);
          expect(
            PublicClientApplication.prototype.acquireTokenPopup
          ).toHaveBeenCalledWith(request);
          done();
        },
      });
    });
  });

  describe("handleRedirectObservable", () => {
    it("success and resets inProgress event to none", (done) => {
      const sampleAccessToken = {
        accessToken: "123abc",
      };

      //@ts-ignore
      broadcastService._inProgress.next(InteractionStatus.Startup);

      spyOn(PublicClientApplication.prototype, "initialize").and.returnValue(
        Promise.resolve()
      );

      spyOn(
        PublicClientApplication.prototype,
        "handleRedirectPromise"
      ).and.returnValue(
        new Promise((resolve) => {
          //@ts-ignore
          resolve(sampleAccessToken);
        })
      );

      authService
        .handleRedirectObservable()
        .subscribe((response: AuthenticationResult) => {
          expect(response.accessToken).toBe(sampleAccessToken.accessToken);
          expect(
            PublicClientApplication.prototype.initialize
          ).toHaveBeenCalled();
          expect(
            PublicClientApplication.prototype.handleRedirectPromise
          ).toHaveBeenCalled();
          broadcastService.inProgress$.subscribe((result) => {
            expect(result).toBe(InteractionStatus.None);
          });
          done();
        });
    });

    it("failure and also resets inProgress event to none", (done) => {
      const sampleError = new AuthError("123", "message");

      //@ts-ignore
      broadcastService._inProgress.next(InteractionStatus.Startup);

      spyOn(PublicClientApplication.prototype, "initialize").and.returnValue(
        Promise.resolve()
      );

      spyOn(
        PublicClientApplication.prototype,
        "handleRedirectPromise"
      ).and.returnValue(
        new Promise((resolve, reject) => {
          reject(sampleError);
        })
      );

      authService.handleRedirectObservable().subscribe({
        error: (error: AuthError) => {
          expect(error.message).toBe(sampleError.message);
          expect(
            PublicClientApplication.prototype.initialize
          ).toHaveBeenCalled();
          expect(
            PublicClientApplication.prototype.handleRedirectPromise
          ).toHaveBeenCalled();
          broadcastService.inProgress$.pipe(takeLast(1)).subscribe((result) => {
            console.log("failure result", result);
            expect(result).toBe(InteractionStatus.None);
          });
          done();
        },
      });
    });

    it("called with hash string (legacy)", (done) => {
      const sampleAccessToken = {
        accessToken: "123abc",
      };

      const hash = "#/test";

      spyOn(
        PublicClientApplication.prototype,
        "handleRedirectPromise"
      ).and.returnValue(
        new Promise((resolve) => {
          //@ts-ignore
          resolve(sampleAccessToken);
        })
      );

      authService
        .handleRedirectObservable(hash)
        .subscribe((response: AuthenticationResult) => {
          expect(response.accessToken).toBe(sampleAccessToken.accessToken);
          expect(
            PublicClientApplication.prototype.handleRedirectPromise
          ).toHaveBeenCalledWith({ hash: hash });
          done();
        });
    });

    it("called with hash in options object", (done) => {
      const sampleAccessToken = {
        accessToken: "123abc",
      };

      const hash = "#/test";

      spyOn(
        PublicClientApplication.prototype,
        "handleRedirectPromise"
      ).and.returnValue(
        new Promise((resolve) => {
          //@ts-ignore
          resolve(sampleAccessToken);
        })
      );

      authService
        .handleRedirectObservable({ hash })
        .subscribe((response: AuthenticationResult) => {
          expect(response.accessToken).toBe(sampleAccessToken.accessToken);
          expect(
            PublicClientApplication.prototype.handleRedirectPromise
          ).toHaveBeenCalledWith({ hash: hash });
          done();
        });
    });

    it("called with navigateToLoginRequestUrl", (done) => {
      const sampleAccessToken = {
        accessToken: "123abc",
      };

      spyOn(
        PublicClientApplication.prototype,
        "handleRedirectPromise"
      ).and.returnValue(
        new Promise((resolve) => {
          //@ts-ignore
          resolve(sampleAccessToken);
        })
      );

      authService
        .handleRedirectObservable({ navigateToLoginRequestUrl: false })
        .subscribe((response: AuthenticationResult) => {
          expect(response.accessToken).toBe(sampleAccessToken.accessToken);
          expect(
            PublicClientApplication.prototype.handleRedirectPromise
          ).toHaveBeenCalledWith({ navigateToLoginRequestUrl: false });
          done();
        });
    });
  });

  describe("setLogger", () => {
    it("works", () => {
      spyOn(PublicClientApplication.prototype, "setLogger");
      authService.setLogger(new Logger({}));
      expect(PublicClientApplication.prototype.setLogger).toHaveBeenCalled();
    });
  });
});
