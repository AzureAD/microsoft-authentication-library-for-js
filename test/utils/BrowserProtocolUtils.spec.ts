import { expect } from "chai";
import { BrowserProtocolUtils, BrowserStateObject } from "../../src/utils/BrowserProtocolUtils";
import { InteractionType } from "../../src/utils/BrowserConstants";
import { ICrypto, PkceCodes } from "@azure/msal-common";
import { RANDOM_TEST_GUID, TEST_CONFIG } from "./StringConstants";

describe("BrowserProtocolUtils.ts Unit Tests", () => {

    const platformLibState = `{"interactionType":"${InteractionType.REDIRECT}"}`;
    const platformLibStateObj = JSON.parse(platformLibState) as BrowserStateObject;
    const encodedPlatformLibState = `eyJpZCI6IiR7UkFORE9NX1RFU1RfR1VJRH0iLCJ0cyI6JHt0ZXN0VGltZVN0YW1wfX0=`;

    let cryptoInterface: ICrypto;
    beforeEach(() => {
        cryptoInterface = {
            createNewGuid(): string {
                return RANDOM_TEST_GUID;
            },
            base64Decode(input: string): string {
                switch (input) {
                    case encodedPlatformLibState:
                        return platformLibState;
                    default:
                        return input;
                }
            },
            base64Encode(input: string): string {
                switch (input) {
                    case `${platformLibState}`:
                        return encodedPlatformLibState;
                    default:
                        return input;
                }
            },
            async generatePkceCodes(): Promise<PkceCodes> {
                return {
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                };
            },
        };
    });

    it("generateBrowserRequestState() returns an empty string if given interaction type is null or empty", () => {
        const requestState = BrowserProtocolUtils.generateBrowserRequestState(cryptoInterface, null);
        expect(requestState).to.be.empty;
    });

    it("generateBrowserRequestState() returns a valid platform state string", () => {
        const requestState = BrowserProtocolUtils.generateBrowserRequestState(cryptoInterface, InteractionType.REDIRECT);
        expect(requestState).to.be.eq(encodedPlatformLibState);
    });

    it("parseBrowserRequestState() returns null state object if state string is empty", () => {
        const requestStateObj = BrowserProtocolUtils.parseBrowserRequestState(cryptoInterface, "");
        expect(requestStateObj).to.be.null;
    });

    it("parseBrowserRequestState() returns a valid browser request state", () => {
        const requestStateObj = BrowserProtocolUtils.parseBrowserRequestState(cryptoInterface, encodedPlatformLibState);
        expect(requestStateObj).to.be.deep.eq(platformLibStateObj);
    });
});
