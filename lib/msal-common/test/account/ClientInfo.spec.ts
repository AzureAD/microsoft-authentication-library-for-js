import {
    buildClientInfo,
    buildClientInfoFromHomeAccountId,
    ClientInfo,
} from "../../src/account/ClientInfo";
import { TEST_DATA_CLIENT_INFO } from "../test_kit/StringConstants";
import { ICrypto } from "../../src/crypto/ICrypto";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
    ClientAuthErrorMessage,
    createClientAuthError,
} from "../../src/error/ClientAuthError";
import { Constants } from "../../src";
import { mockCrypto } from "../client/ClientTestUtils.js";

describe("ClientInfo.ts Class Unit Tests", () => {
    describe("buildClientInfo()", () => {
        let cryptoInterface: ICrypto;
        beforeEach(() => {
            cryptoInterface = mockCrypto;
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("Throws error if clientInfo is null or empty", () => {
            // @ts-ignore
            expect(() => buildClientInfo(null, cryptoInterface)).toThrowError(
                ClientAuthErrorMessage.clientInfoEmptyError.desc
            );
            // @ts-ignore
            expect(() => buildClientInfo(null, cryptoInterface)).toThrowError(
                ClientAuthError
            );

            expect(() =>
                buildClientInfo("", cryptoInterface.base64Decode)
            ).toThrowError(ClientAuthErrorMessage.clientInfoEmptyError.desc);
            expect(() =>
                buildClientInfo("", cryptoInterface.base64Decode)
            ).toThrowError(ClientAuthError);
        });

        it("Throws error if function could not successfully decode ", () => {
            expect(() =>
                buildClientInfo(
                    "ThisCan'tbeParsed",
                    cryptoInterface.base64Decode
                )
            ).toThrowError(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(() =>
                buildClientInfo(
                    "ThisCan'tbeParsed",
                    cryptoInterface.base64Decode
                )
            ).toThrowError(ClientAuthError);
        });

        it("Succesfully returns decoded client info", () => {
            const clientInfo = buildClientInfo(
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                cryptoInterface.base64Decode
            );

            expect(clientInfo.uid).toBe(TEST_DATA_CLIENT_INFO.TEST_UID);
            expect(clientInfo.utid).toBe(TEST_DATA_CLIENT_INFO.TEST_UTID);
        });
    });

    describe("buildClientInfoFromHomeAccountId", () => {
        it("throws error if homeAccountId is not in the correct format", () => {
            expect(() => buildClientInfoFromHomeAccountId("")).toThrowError(
                ClientAuthError
            );
            expect(() => buildClientInfoFromHomeAccountId("")).toThrowError(
                createClientAuthError(
                    ClientAuthErrorCodes.clientInfoDecodingError
                )
            );
        });

        it("Builds partial clientInfo from homeAccountId with only single string", () => {
            const expectedClientInfo: ClientInfo = {
                uid: TEST_DATA_CLIENT_INFO.TEST_UID,
                utid: Constants.EMPTY_STRING,
            };
            expect(
                buildClientInfoFromHomeAccountId(TEST_DATA_CLIENT_INFO.TEST_UID)
            ).toMatchObject(expectedClientInfo);
        });

        it("successfully returns client info built from homeAccountId", () => {
            const expectedClientInfo: ClientInfo = {
                uid: TEST_DATA_CLIENT_INFO.TEST_UID,
                utid: TEST_DATA_CLIENT_INFO.TEST_UTID,
            };
            expect(
                buildClientInfoFromHomeAccountId(
                    TEST_DATA_CLIENT_INFO.TEST_DECODED_HOME_ACCOUNT_ID
                )
            ).toMatchObject(expectedClientInfo);
        });
    });
});
