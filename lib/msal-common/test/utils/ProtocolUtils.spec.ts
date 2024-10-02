import { ProtocolUtils } from "../../src/utils/ProtocolUtils.js";
import {
    RANDOM_TEST_GUID,
    TEST_CRYPTO_VALUES,
    TEST_POP_VALUES,
} from "../test_kit/StringConstants.js";
import { ICrypto } from "../../src/crypto/ICrypto.js";
import { Constants } from "../../src/utils/Constants.js";
import {
    ClientAuthError,
    ClientAuthErrorMessage,
} from "../../src/error/ClientAuthError.js";

describe("ProtocolUtils.ts Class Unit Tests", () => {
    const userState = "userState";
    const decodedLibState = `{"id":"${RANDOM_TEST_GUID}"}`;
    const encodedLibState = `eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSJ9`;
    const testState = `${encodedLibState}${Constants.RESOURCE_DELIM}${userState}`;

    let cryptoInterface: ICrypto;
    beforeEach(() => {
        cryptoInterface = {
            createNewGuid(): string {
                return RANDOM_TEST_GUID;
            },
            base64Decode(input: string): string {
                switch (input) {
                    case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
                    case encodedLibState:
                        return decodedLibState;
                    default:
                        return input;
                }
            },
            base64Encode(input: string): string {
                switch (input) {
                    case TEST_POP_VALUES.DECODED_REQ_CNF:
                        return TEST_POP_VALUES.ENCODED_REQ_CNF;
                    case `${decodedLibState}`:
                        return encodedLibState;
                    default:
                        return input;
                }
            },
            base64UrlEncode(input: string): string {
                switch (input) {
                    case '{"kid": "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc"}':
                        return "eyJraWQiOiAiWG5zdUF2dHRUUHAwbm4xS19ZTUxlUExEYnA3c3lDS2hOSHQ3SGpZSEpZYyJ9";
                    default:
                        return input;
                }
            },
            encodeKid(input: string): string {
                switch (input) {
                    case "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc":
                        return "eyJraWQiOiAiWG5zdUF2dHRUUHAwbm4xS19ZTUxlUExEYnA3c3lDS2hOSHQ3SGpZSEpZYyJ9";
                    default:
                        return input;
                }
            },
            async getPublicKeyThumbprint(): Promise<string> {
                return TEST_POP_VALUES.KID;
            },
            async signJwt(): Promise<string> {
                return "";
            },
            async removeTokenBindingKey(): Promise<boolean> {
                return Promise.resolve(true);
            },
            async clearKeystore(): Promise<boolean> {
                return Promise.resolve(true);
            },
            async hashString(): Promise<string> {
                return Promise.resolve(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
            },
        };
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
