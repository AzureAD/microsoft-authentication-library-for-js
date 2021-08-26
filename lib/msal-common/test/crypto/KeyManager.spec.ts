import sinon from "sinon";
import { ICrypto, PkceCodes, AuthenticationScheme, ServerAuthorizationTokenResponse } from "../../src";
import { RANDOM_TEST_GUID, TEST_POP_VALUES, TEST_DATA_CLIENT_INFO, TEST_CONFIG, TEST_URIS, DECRYPTED_BOUND_RT_AUTHENTICATION_RESULT_DEFAULT_SCOPES, RANDOM_TEST_CTX, SIGNED_BOUND_TOKEN_REQUEST } from "../test_kit/StringConstants";
import { KeyManager } from "../../src/crypto/KeyManager";

describe("KeyManager Unit Tests", () => {

    afterEach(() => {
        sinon.restore();
    });

    const cryptoInterface: ICrypto = {
        createNewGuid(): string {
            return RANDOM_TEST_GUID;
        },
        createNewCtx(): Uint8Array {
            return RANDOM_TEST_CTX;
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
            return TEST_POP_VALUES.DECODED_STK_JWK_THUMBPRINT
        },
        async decryptBoundTokenResponse(): Promise<ServerAuthorizationTokenResponse> {
            return DECRYPTED_BOUND_RT_AUTHENTICATION_RESULT_DEFAULT_SCOPES;
        },
        async signBoundTokenRequest(): Promise<string> {
            return SIGNED_BOUND_TOKEN_REQUEST;
        }
    };

    describe("generateCnf", () => {
        const testRequest = {
            authority: TEST_CONFIG.validAuthority,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            authenticationScheme: AuthenticationScheme.POP,
            resourceRequestMethod:"POST",
            resourceRequestUrl: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS
        };

        it("Generates the req_cnf correctly", async () => {
            const keyManager = new KeyManager(cryptoInterface);
            const req_cnf = await keyManager.generateCnf(testRequest);
            expect(req_cnf).toEqual(TEST_POP_VALUES.ENCODED_REQ_CNF);
        });
    });
});