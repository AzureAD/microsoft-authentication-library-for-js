import { expect, use } from "chai";
import { ProtocolUtils } from "../../src/utils/ProtocolUtils";
import { RANDOM_TEST_GUID, TEST_CONFIG } from "./StringConstants";
import { ICrypto, PkceCodes } from "../../src/crypto/ICrypto";
import { Constants } from "../../src/utils/Constants";
import sinon from "sinon";
import { TimeUtils } from "../../src/utils/TimeUtils";
import { ClientAuthError, ClientAuthErrorMessage } from "../../src";

describe("ProtocolUtils.ts Class Unit Tests", () => {

    const userState = "userState";
    const testTimeStamp = 1592846482;
    const decodedLibState = `{"id":"${RANDOM_TEST_GUID}","ts":${testTimeStamp}}`;
    const encodedLibState = `eyJpZCI6IiR7UkFORE9NX1RFU1RfR1VJRH0iLCJ0cyI6JHt0ZXN0VGltZVN0YW1wfX0=`;
    const testState = `${encodedLibState}${Constants.RESOURCE_DELIM}${userState}`;

    let cryptoInterface: ICrypto;
    beforeEach(() => {
        cryptoInterface = {
            createNewGuid(): string {
                return RANDOM_TEST_GUID;
            },
            base64Decode(input: string): string {
                switch (input) {
                    case `eyJpZCI6IiR7UkFORE9NX1RFU1RfR1VJRH0iLCJ0cyI6JHt0ZXN0VGltZVN0YW1wfX0=`:
                        return decodedLibState;
                    default:
                        return input;
                }
            },
            base64Encode(input: string): string {
                switch (input) {
                    case `${decodedLibState}`:
                        return "eyJpZCI6IiR7UkFORE9NX1RFU1RfR1VJRH0iLCJ0cyI6JHt0ZXN0VGltZVN0YW1wfX0=";
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

    afterEach(() => {
        sinon.restore();
    });

    it("setRequestState() appends library state to given state", () => {
        sinon.stub(TimeUtils, "nowSeconds").returns(testTimeStamp);
        const requestState = ProtocolUtils.setRequestState(userState, cryptoInterface);
        expect(requestState).to.be.eq(testState);
    });

    it("setRequestState() only creates library state", () => {
        sinon.stub(TimeUtils, "nowSeconds").returns(testTimeStamp);
        const requestState = ProtocolUtils.setRequestState("", cryptoInterface);
        expect(requestState).to.be.eq(encodedLibState);
    });

    it("setRequestState throws error if no crypto object is passed to it", () => {
        expect(() => ProtocolUtils.setRequestState(userState, null)).to.throw(ClientAuthError);
        expect(() => ProtocolUtils.setRequestState(userState, null)).to.throw(ClientAuthErrorMessage.noCryptoObj.desc);
    })

    it("parseRequestState() throws error if given state is null or empty", () => {
        expect(() => ProtocolUtils.parseRequestState("", cryptoInterface)).to.throw(ClientAuthError);
        expect(() => ProtocolUtils.parseRequestState("", cryptoInterface)).to.throw(ClientAuthErrorMessage.invalidStateError.desc);

        expect(() => ProtocolUtils.parseRequestState(null, cryptoInterface)).to.throw(ClientAuthError);
        expect(() => ProtocolUtils.parseRequestState(null, cryptoInterface)).to.throw(ClientAuthErrorMessage.invalidStateError.desc);
    });

    it("parseRequestState() returns empty userRequestState if no resource delimiter found in state string", () => {
        const requestState = ProtocolUtils.parseRequestState(decodedLibState, cryptoInterface);
        expect(requestState.userRequestState).to.be.empty;
    });

    it("parseRequestState() correctly splits the state by the resource delimiter", () => {
        const requestState = ProtocolUtils.parseRequestState(testState, cryptoInterface);
        expect(requestState.userRequestState).to.be.eq(userState);
    });
});
