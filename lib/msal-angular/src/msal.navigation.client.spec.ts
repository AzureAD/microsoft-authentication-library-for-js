import { TestBed } from "@angular/core/testing";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import {
  InteractionType,
  NavigationClient,
  NavigationOptions,
  PublicClientApplication,
} from "@azure/msal-browser";
import { MsalBroadcastService } from "./msal.broadcast.service";
import { MsalGuard } from "./msal.guard";
import { MsalCustomNavigationClient } from "./msal.navigation.client";
import { MsalModule, MsalService } from "./public-api";
import { MsalGuardConfiguration } from "./msal.guard.config";

let authService: MsalService;
let navigationClient: MsalCustomNavigationClient;
let routerMock = {
  navigateByUrl: jasmine.createSpy("navigateByUrl").and.resolveTo(),
};

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "0845a021-afdf-4126-abdd-099c5e6948e1",
    redirectUri: "http://localhost:4200",
  },
});

describe("MsalCustomNaviationClient", () => {
  beforeEach(() => {
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      imports: [
        MsalModule.forRoot(
          msalInstance,
          null as unknown as MsalGuardConfiguration,
          {
            interactionType: InteractionType.Popup,
            protectedResourceMap: new Map(),
          }
        ),
      ],
      providers: [
        MsalBroadcastService,
        { provide: Router, useValue: routerMock },
        Location,
        MsalCustomNavigationClient,
        MsalService,
        MsalGuard,
      ],
      teardown: { destroyAfterEach: false },
    });
    authService = TestBed.inject(MsalService);
    navigationClient = TestBed.inject(MsalCustomNavigationClient);
  });

  describe("NavigateInternal Unit tests", () => {
    it("is created", () => {
      expect(navigationClient).toBeTruthy();
    });

    it("NavigateInternal (noHistory false)", (done) => {
      const url = "http://localhost:4200/profile";
      const normalizedAbsoluteUrl = "/profile";

      const options = {
        noHistory: false,
      } as NavigationOptions;

      const navigateByUrlOptions = {
        replaceUrl: false,
      };

      navigationClient.navigateInternal(url, options).then(() => {
        expect(routerMock.navigateByUrl).toHaveBeenCalledWith(
          normalizedAbsoluteUrl,
          navigateByUrlOptions
        );
        done();
      });
    });

    it("NavigateInternal (noHistory true)", (done) => {
      const url = "http://localhost:4200/profile";

      const options = {
        noHistory: true,
      } as NavigationOptions;

      const windowLocationReplaceSpy = spyOn(
        NavigationClient.prototype,
        "navigateInternal"
      );
      navigationClient.navigateInternal(url, options).then(() => {
        expect(windowLocationReplaceSpy).toHaveBeenCalledWith(url, options);
        done();
      });
    });
  });
});
