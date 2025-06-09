import { ProtocolUtils } from "../../src/utils/ProtocolUtils.js";
import {
    RANDOM_TEST_GUID
} from "../test_kit/StringConstants.js";
import { ICrypto } from "../../src/crypto/ICrypto.js";
import { Constants } from "../../src/utils/Constants.js";
import {
    ClientAuthError,
    ClientAuthErrorMessage,
} from "../../src/error/ClientAuthError.js";
import { mockCrypto } from "../client/ClientTestUtils.js";

describe("ProtocolUtils.ts Class Unit Tests", () => {
    const userState = "userState";
    const decodedLibState = `{"id":"${RANDOM_TEST_GUID}"}`;
    const encodedLibState = `eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSJ9`;
    const testState = `${encodedLibState}${Constants.RESOURCE_DELIM}${userState}`;

    let cryptoInterface: ICrypto;
    beforeEach(() => {
        cryptoInterface = mockCrypto;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("setRequestState() appends library state to given state", () => {
        const requestState = ProtocolUtils.setRequestState(
            cryptoInterface,
            userState
        );
        expect(requestState).toBe(testState);
    });

    it("setRequestState() only creates library state", () => {
        const requestState = ProtocolUtils.setRequestState(cryptoInterface, "");
        expect(requestState).toBe(encodedLibState);
    });

    it("setRequestState throws error if no crypto object is passed to it", () => {
        expect(() =>
            // @ts-ignore
            ProtocolUtils.setRequestState(null, userState)
        ).toThrowError(ClientAuthError);
        expect(() =>
            // @ts-ignore
            ProtocolUtils.setRequestState(null, userState)
        ).toThrowError(ClientAuthErrorMessage.noCryptoObj.desc);
    });

    it("parseRequestState() throws error if given state is null or empty", () => {
        expect(() =>
            ProtocolUtils.parseRequestState(cryptoInterface, "")
        ).toThrowError(ClientAuthError);
        expect(() =>
            ProtocolUtils.parseRequestState(cryptoInterface, "")
        ).toThrowError(ClientAuthErrorMessage.invalidStateError.desc);

        expect(() =>
            // @ts-ignore
            ProtocolUtils.parseRequestState(cryptoInterface, null)
        ).toThrowError(ClientAuthError);

        expect(() =>
            // @ts-ignore
            ProtocolUtils.parseRequestState(cryptoInterface, null)
        ).toThrowError(ClientAuthErrorMessage.invalidStateError.desc);
    });

    it("parseRequestState() returns empty userRequestState if no resource delimiter found in state string", () => {
        const requestState = ProtocolUtils.parseRequestState(
            cryptoInterface,
            decodedLibState
        );
        expect(requestState.userRequestState).toHaveLength(0);
    });

    it("parseRequestState() correctly splits the state by the resource delimiter", () => {
        const requestState = ProtocolUtils.parseRequestState(
            cryptoInterface,
            testState
        );
        expect(requestState.userRequestState).toBe(userState);
    });

    it("parseRequestState returns user state without decoding", () => {
        const requestState = ProtocolUtils.parseRequestState(
            cryptoInterface,
            `${encodedLibState}${Constants.RESOURCE_DELIM}${"test%25u00f1"}`
        );
        expect(requestState.userRequestState).toBe(`${"test%25u00f1"}`);
    });
});
