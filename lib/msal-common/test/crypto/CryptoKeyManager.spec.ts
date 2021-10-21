import sinon from "sinon";
import { ICrypto, PkceCodes, AuthenticationScheme, CryptoKeyTypes } from "../../src";
import { RANDOM_TEST_GUID, TEST_POP_VALUES, TEST_DATA_CLIENT_INFO, TEST_CONFIG, TEST_URIS } from "../test_kit/StringConstants";
import { CryptoKeyManager } from "../../src/crypto/CryptoKeyManager";

describe("CryptoKeyManager Unit Tests", () => {

    afterEach(() => {
        sinon.restore();
    });

    const cryptoInterface: ICrypto = {
        createNewGuid(): string {
            return RANDOM_TEST_GUID;
        },
        base64Decode(input: string): string {
            switch (input) {
                case TEST_POP_VALUES.ENCODED_REQ_CNF:
                    return TEST_POP_VALUES.DECODED_REQ_CNF;
                case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                    return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                case TEST_POP_VALUES.SAMPLE_POP_AT_PAYLOAD_ENCODED:
                    return TEST_POP_VALUES.SAMPLE_POP_AT_PAYLOAD_DECODED;
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
                case TEST_POP_VALUES.SAMPLE_POP_AT_PAYLOAD_DECODED:
                    return TEST_POP_VALUES.SAMPLE_POP_AT_PAYLOAD_ENCODED;
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
        },     
        async removeTokenBindingKey(): Promise<boolean> {
            return Promise.resolve(true);
        },
        async clearKeystore(): Promise<boolean> {
            return Promise.resolve(true);
        },
        async getAsymmetricPublicKey(): Promise<string> {
            return TEST_POP_VALUES.DECODED_STK_JWK_THUMBPRINT;
        }
    };

    let cryptoKeyManager: CryptoKeyManager;

    const testPopRequest = {
        authority: TEST_CONFIG.validAuthority,
        scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        correlationId: TEST_CONFIG.CORRELATION_ID,
        authenticationScheme: AuthenticationScheme.POP,
        resourceRequestMethod:"POST",
        resourceRequestUrl: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS
    };

    beforeEach(() => {
        cryptoKeyManager = new CryptoKeyManager(cryptoInterface);
    });

    describe("generateCnf", () => {
        it("generates the req_cnf correctly", async () => {
            const reqCnf = await cryptoKeyManager.generateCnf(testPopRequest);
            expect(reqCnf).toBe(TEST_POP_VALUES.ENCODED_REQ_CNF);
        });
    });

    describe("generateKid", () => {
        it("returns the correct kid and key storage location", async () => {
            const reqCnf = await cryptoKeyManager.generateKid(testPopRequest, CryptoKeyTypes.ReqCnf);
            expect(reqCnf).toStrictEqual(JSON.parse(TEST_POP_VALUES.DECODED_REQ_CNF));
        });
    });
});