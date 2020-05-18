import { expect } from "chai";
import { ProtocolUtils, LibraryStateObject, RequestStateObject } from "../../src/utils/ProtocolUtils";
import { RANDOM_TEST_GUID, TEST_DATA_CLIENT_INFO, TEST_CONFIG } from "./StringConstants";
import { Constants, ICrypto, PkceCodes, ClientAuthErrorMessage, ClientAuthError } from "../../src";
import { TimeUtils } from "../../src/utils/TimeUtils";

describe("ProtocolUtils.ts Class Unit Tests", () => {

    let cryptoInterface: ICrypto;
    beforeEach(() => {
        cryptoInterface = {
            createNewGuid(): string {
                return RANDOM_TEST_GUID;
            },
            base64Decode(input: string): string {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            },
            base64Encode(input: string): string {
                switch (input) {
                    case "123-test-uid":
                        return "MTIzLXRlc3QtdWlk";
                    case "456-test-utid":
                        return "NDU2LXRlc3QtdXRpZA==";
                    default:
                        return input;
                }
            },
            async generatePkceCodes(): Promise<PkceCodes> {
                return {
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER
                }
            }
        };
    })

    it("setRequestState() appends library state to given state", () => {
        const testState = "testState";
        const requestState = ProtocolUtils.setRequestState(testState, RANDOM_TEST_GUID, cryptoInterface);
        const parsedState = ProtocolUtils.parseRequestState(requestState, cryptoInterface);
        expect(requestState).to.be.eq(`${JSON.stringify(parsedState.libraryState)}${Constants.RESOURCE_DELIM}${testState}`);
    });

    it("setRequestState() only creates library state", () => {
        const requestState = ProtocolUtils.setRequestState("", RANDOM_TEST_GUID, cryptoInterface);
        const parsedState = ProtocolUtils.parseRequestState(requestState, cryptoInterface);
        expect(requestState).to.be.eq(`${JSON.stringify(parsedState.libraryState)}`);
    });

    it("parseRequestState() throws error if serverResponseState is null or empty", () => {
        expect(() => ProtocolUtils.parseRequestState("", cryptoInterface)).to.throw(ClientAuthErrorMessage.invalidStateError.desc);
        expect(() => ProtocolUtils.parseRequestState("", cryptoInterface)).to.throw(ClientAuthError);
        expect(() => ProtocolUtils.parseRequestState(null, cryptoInterface)).to.throw(ClientAuthErrorMessage.invalidStateError.desc);
        expect(() => ProtocolUtils.parseRequestState(null, cryptoInterface)).to.throw(ClientAuthError);
    });

    it("parseRequestState() throws error if no resource delimiter found in state string and state string is not a stringified object", () => {
        const testState = "testState";
        expect(() => ProtocolUtils.parseRequestState(testState, cryptoInterface)).to.throw(ClientAuthErrorMessage.invalidStateError.desc);
        expect(() => ProtocolUtils.parseRequestState(testState, cryptoInterface)).to.throw(ClientAuthError);
    });

    it("parseRequestState() correctly splits the state by the resource delimiter", () => {
        const testState = "testState";
        const libraryState: LibraryStateObject = {
            id: "testState",
            ts: TimeUtils.nowSeconds()
        };
        const stateObject: RequestStateObject = {
            userRequestState: testState,
            libraryState: libraryState
        };
        const requestState = `${JSON.stringify(libraryState)}${Constants.RESOURCE_DELIM}${testState}`;
        expect(ProtocolUtils.parseRequestState(requestState, cryptoInterface)).to.be.deep.eq(stateObject);
    });

    it("parseRequestState() correctly splits the state when the userRequestState contains a resource delimiter", () => {
        const testState = "testState|has|resource|delim";
        const libraryState: LibraryStateObject = {
            id: "testState",
            ts: TimeUtils.nowSeconds()
        };
        const stateObject: RequestStateObject = {
            userRequestState: testState,
            libraryState: libraryState
        };
        const requestState = `${JSON.stringify(libraryState)}${Constants.RESOURCE_DELIM}${testState}`;
        expect(ProtocolUtils.parseRequestState(requestState, cryptoInterface)).to.be.deep.eq(stateObject);
    });
});
