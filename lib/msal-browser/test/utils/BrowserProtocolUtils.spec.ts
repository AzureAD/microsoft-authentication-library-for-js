import {
    extractBrowserRequestState,
    BrowserStateObject,
} from "../../src/utils/BrowserProtocolUtils.js";
import { InteractionType } from "../../src/utils/BrowserConstants.js";
import { Logger, ProtocolUtils } from "@azure/msal-common";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage.js";
import { TEST_HASHES } from "./StringConstants.js";

describe("BrowserProtocolUtils.ts Unit Tests", () => {
    const browserRedirectRequestState: BrowserStateObject = {
        interactionType: InteractionType.Redirect,
    };
    const browserPopupRequestState: BrowserStateObject = {
        interactionType: InteractionType.Popup,
    };

    let cryptoInterface: CryptoOps;
    let dbStorage = {};
    beforeEach(() => {
        jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
            async (): Promise<void> => {
                dbStorage = {};
            }
        );
        cryptoInterface = new CryptoOps(new Logger({}));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("extractBrowserRequestState() returns an null if given interaction type is null or empty", () => {
        //@ts-ignore
        const requestState1 = extractBrowserRequestState(
            cryptoInterface,
            //@ts-ignore
            null
        );
        expect(requestState1).toBeNull();

        const requestState2 = extractBrowserRequestState(cryptoInterface, "");
        expect(requestState2).toBeNull();
    });

    it("extractBrowserRequestState() returns a valid platform state string", () => {
        const redirectState = ProtocolUtils.setRequestState(
            cryptoInterface,
            undefined,
            browserRedirectRequestState
        );
        const popupState = ProtocolUtils.setRequestState(
            cryptoInterface,
            undefined,
            browserPopupRequestState
        );
        const redirectPlatformState = extractBrowserRequestState(
            cryptoInterface,
            redirectState
        );
        expect(redirectPlatformState!.interactionType).toBe(
            InteractionType.Redirect
        );
        const popupPlatformState = extractBrowserRequestState(
            cryptoInterface,
            popupState
        );
        expect(popupPlatformState!.interactionType).toBe(InteractionType.Popup);
    });
});
