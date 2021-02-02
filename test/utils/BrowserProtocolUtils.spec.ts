import { expect } from "chai";
import sinon from "sinon";
import { BrowserProtocolUtils, BrowserStateObject } from "../../src/utils/BrowserProtocolUtils";
import { InteractionType } from "../../src/utils/BrowserConstants";
import { ProtocolUtils } from "@azure/msal-common";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import { TEST_HASHES } from "./StringConstants";

describe("BrowserProtocolUtils.ts Unit Tests", () => {

    const browserRedirectRequestState: BrowserStateObject = { interactionType: InteractionType.Redirect };
    const browserPopupRequestState: BrowserStateObject = { interactionType: InteractionType.Popup };

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
        expect(redirectPlatformState.interactionType).to.be.eq(InteractionType.Redirect);
        const popupPlatformState = BrowserProtocolUtils.extractBrowserRequestState(cryptoInterface, popupState);
        expect(popupPlatformState.interactionType).to.be.eq(InteractionType.Popup);
    });

    describe("parseServerResponseFromHash", () => {
        it("parses code from hash", () => {
            const serverParams = BrowserProtocolUtils.parseServerResponseFromHash(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);

            expect(serverParams).to.deep.equal({
                "client_info": "eyJ1aWQiOiIxMjMtdGVzdC11aWQiLCJ1dGlkIjoiNDU2LXRlc3QtdXRpZCJ9",
                "code": "thisIsATestCode",
                "state": "eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicmVkaXJlY3QifX0=|userState"
            });
        });

        it("parses error from hash", () => {
            const serverParams = BrowserProtocolUtils.parseServerResponseFromHash(TEST_HASHES.TEST_ERROR_HASH);

            expect(serverParams).to.deep.equal({
                "error": "error_code",
                "error_description": "msal error description",
                "state": "eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicmVkaXJlY3QifX0=|userState"
            });
        });

        it("parses tokens from hash", () => {
            const serverParams = BrowserProtocolUtils.parseServerResponseFromHash(TEST_HASHES.TEST_SUCCESS_ACCESS_TOKEN_HASH);

            expect(serverParams).to.deep.equal({
                "access_token": "this.isan.accesstoken",
                "client_info": "eyJ1aWQiOiIxMjMtdGVzdC11aWQiLCJ1dGlkIjoiNDU2LXRlc3QtdXRpZCJ9",
                "expiresIn": "3599",
                "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0=.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw",
                "scope": "test",
                "state": "eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicmVkaXJlY3QifX0=|userState"
            });
        });

        it("handles empty hash", () => {
            const serverParams = BrowserProtocolUtils.parseServerResponseFromHash("#");
            expect(serverParams).to.deep.equal({});
        });

        it("handles empty string", () => {
            const serverParams = BrowserProtocolUtils.parseServerResponseFromHash("");
            expect(serverParams).to.deep.equal({});
        });
    });
});
