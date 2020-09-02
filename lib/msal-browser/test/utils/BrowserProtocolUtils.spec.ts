import { expect } from "chai";
import sinon from "sinon";
import { BrowserProtocolUtils, BrowserStateObject } from "../../src/utils/BrowserProtocolUtils";
import { InteractionType } from "../../src/utils/BrowserConstants";
import { ProtocolUtils } from "@azure/msal-common";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";

describe("BrowserProtocolUtils.ts Unit Tests", () => {

    const browserRedirectRequestState: BrowserStateObject = { interactionType: InteractionType.REDIRECT };
    const browserPopupRequestState: BrowserStateObject = { interactionType: InteractionType.POPUP };

    let cryptoInterface: CryptoOps;
    let dbStorage = {};
    beforeEach(() => {
        sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
            dbStorage = {};
        });
        cryptoInterface = new CryptoOps();
    });

    afterEach(() => {
        sinon.restore(); 
    });

    it("extractBrowserRequestState() returns an null if given interaction type is null or empty", () => {
        const requestState1 = BrowserProtocolUtils.extractBrowserRequestState(cryptoInterface, null);
        expect(requestState1).to.be.null;
        
        const requestState2 = BrowserProtocolUtils.extractBrowserRequestState(cryptoInterface, "");
        expect(requestState2).to.be.null;
    });

    it("extractBrowserRequestState() returns a valid platform state string", () => {
        const redirectState = ProtocolUtils.setRequestState(cryptoInterface, null, browserRedirectRequestState);
        const popupState = ProtocolUtils.setRequestState(cryptoInterface, null, browserPopupRequestState);
        const redirectPlatformState = BrowserProtocolUtils.extractBrowserRequestState(cryptoInterface, redirectState);
        expect(redirectPlatformState.interactionType).to.be.eq(InteractionType.REDIRECT);
        const popupPlatformState = BrowserProtocolUtils.extractBrowserRequestState(cryptoInterface, popupState);
        expect(popupPlatformState.interactionType).to.be.eq(InteractionType.POPUP);
    });
});
