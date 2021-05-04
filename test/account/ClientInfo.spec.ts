import { expect } from "chai";
import { buildClientInfo } from "../../src/account/ClientInfo";
import { TEST_CONFIG, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_POP_VALUES } from "../test_kit/StringConstants";
import { PkceCodes, ICrypto } from "../../src/crypto/ICrypto";
import sinon from "sinon";
import { ClientAuthError, ClientAuthErrorMessage } from "../../src";

describe("ClientInfo.ts Class Unit Tests", () => {

    describe("buildClientInfo()", () => {
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
                        case "456-test-uid":
                            return "NDU2LXRlc3QtdWlk";
                        case TEST_POP_VALUES.DECODED_REQ_CNF:
                            return TEST_POP_VALUES.ENCODED_REQ_CNF;
                        default:
                            return input;
                    }
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                },
                async getPublicKeyThumbprint(): Promise<string> {
                    return TEST_POP_VALUES.KID;
                },
                async signJwt(): Promise<string> {
                    return "";
                }
            };
        });

        afterEach(() => {
            sinon.restore();
        });

        it("Throws error if clientInfo is null or empty", () => {
            // @ts-ignore
            expect(() => buildClientInfo(null, cryptoInterface)).to.throw(ClientAuthErrorMessage.clientInfoEmptyError.desc);
            // @ts-ignore
            expect(() => buildClientInfo(null, cryptoInterface)).to.throw(ClientAuthError);

            expect(() => buildClientInfo("", cryptoInterface)).to.throw(ClientAuthErrorMessage.clientInfoEmptyError.desc);
            expect(() => buildClientInfo("", cryptoInterface)).to.throw(ClientAuthError);
        });

        it("Throws error if function could not successfully decode ", () => {
            expect(() => buildClientInfo("ThisCan'tbeParsed", cryptoInterface)).to.throw(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(() => buildClientInfo("ThisCan'tbeParsed", cryptoInterface)).to.throw(ClientAuthError);
        });

        it("Succesfully returns decoded client info", () => {
            const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, cryptoInterface);

            expect(clientInfo.uid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UID);
            expect(clientInfo.utid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UTID);
        });
    });
});
