import {
    RANDOM_TEST_GUID,
    TEST_POP_VALUES,
    TEST_DATA_CLIENT_INFO,
    TEST_CONFIG,
    TEST_URIS,
    TEST_CRYPTO_VALUES,
} from "../test_kit/StringConstants.js";
import { PopTokenGenerator } from "../../src/crypto/PopTokenGenerator.js";
import { ICrypto } from "../../src/crypto/ICrypto.js";
import { BaseAuthRequest } from "../../src/request/BaseAuthRequest.js";
import * as TimeUtils from "../../src/utils/TimeUtils.js";
import { UrlString } from "../../src/url/UrlString.js";
import { AuthenticationScheme } from "../../src/utils/Constants.js";
import { SignedHttpRequest } from "../../src/crypto/SignedHttpRequest.js";
import { Logger } from "../../src/logger/Logger.js";

describe("PopTokenGenerator Unit Tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
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
        base64UrlEncode(input: string): string {
            switch (input) {
                case '{"kid": "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc"}':
                    return "e2tpZDogIlhuc3VBdnR0VFBwMG5uMUtfWU1MZVBMRGJwN3N5Q0toTkh0N0hqWUhKWWMifQ";
                case '{"kid":"NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs","xms_ksl":"sw"}':
                    return "eyJraWQiOiJOemJMc1hoOHVEQ2NkLTZNTndYRjRXXzdub1dYRlpBZkhreFpzUkdDOVhzIiwieG1zX2tzbCI6InN3In0";
                default:
                    return input;
            }
        },
        encodeKid(input: string): string {
            switch (input) {
                case "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc":
                    return "eyJraWQiOiAiWG5zdUF2dHRUUHAwbm4xS19ZTUxlUExEYnA3c3lDS2hOSHQ3SGpZSEpZYyJ9";
                case "NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs":
                    return "eyJraWQiOiJOemJMc1hoOHVEQ2NkLTZNTndYRjRXXzdub1dYRlpBZkhreFpzUkdDOVhzIiwieG1zX2tzbCI6InN3In0";
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

    describe("generateCnf", () => {
        const testRequest = {
            authority: TEST_CONFIG.validAuthority,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            resourceRequestMethod: "POST",
            resourceRequestUrl: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS,
        };
        it("Generates the req_cnf correctly", async () => {
            const popTokenGenerator = new PopTokenGenerator(cryptoInterface);
            const reqCnfData = await popTokenGenerator.generateCnf(
                testRequest,
                new Logger({})
            );
            expect(reqCnfData.reqCnfString).toBe(
                TEST_POP_VALUES.ENCODED_REQ_CNF
            );
            expect(reqCnfData.kid).toBe(TEST_POP_VALUES.KID);
        });
    });

    describe("signPopToken", () => {
        let currTime: number;
        let testRequest: BaseAuthRequest;

        beforeAll(() => {
            currTime = TimeUtils.nowSeconds();
            testRequest = {
                authority: TEST_CONFIG.validAuthority,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                correlationId: TEST_CONFIG.CORRELATION_ID,
            };
            jest.spyOn(TimeUtils, "nowSeconds").mockReturnValue(currTime);
        });

        it("Signs the proof-of-possession JWT token with all PoP parameters in the request", (done) => {
            const popTokenGenerator = new PopTokenGenerator(cryptoInterface);
            const accessToken = TEST_POP_VALUES.SAMPLE_POP_AT;
            const resourceReqMethod = "POST";
            const resourceUrl = TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS;
            const resourceUrlString = new UrlString(resourceUrl);
            const resourceUrlComponents = resourceUrlString.getUrlComponents();
            const currTime = TimeUtils.nowSeconds();
            const shrClaims = TEST_POP_VALUES.CLIENT_CLAIMS;
            const shrNonce = TEST_POP_VALUES.SHR_NONCE;

            // Set PoP parameters in auth request
            const popRequest = {
                ...testRequest,
                authenticationScheme: AuthenticationScheme.POP,
                resourceRequestMethod: resourceReqMethod,
                resourceRequestUri: resourceUrl,
                shrClaims: shrClaims,
                shrNonce: shrNonce,
            };

            cryptoInterface.signJwt = (
                payload: SignedHttpRequest,
                kid: string
            ): Promise<string> => {
                expect(kid).toBe(TEST_POP_VALUES.KID);
                const expectedPayload = {
                    at: accessToken,
                    ts: currTime,
                    m: resourceReqMethod,
                    u: resourceUrlComponents.HostNameAndPort,
                    nonce: shrNonce,
                    p: resourceUrlComponents.AbsolutePath,
                    q: [[], resourceUrlComponents.QueryString],
                    client_claims: shrClaims,
                };

                expect(payload).toEqual(expectedPayload);
                done();
                return Promise.resolve("");
            };
            popTokenGenerator.signPopToken(
                accessToken,
                TEST_POP_VALUES.KID,
                popRequest
            );
        });

        it("Signs the proof-of-possession JWT token when PoP parameters are undefined", (done) => {
            const popTokenGenerator = new PopTokenGenerator(cryptoInterface);
            const accessToken = TEST_POP_VALUES.SAMPLE_POP_AT;
            const currTime = TimeUtils.nowSeconds();
            cryptoInterface.signJwt = (
                payload: SignedHttpRequest,
                kid: string
            ): Promise<string> => {
                expect(kid).toBe(TEST_POP_VALUES.KID);
                const expectedPayload = {
                    at: accessToken,
                    ts: currTime,
                    m: undefined,
                    u: undefined,
                    nonce: RANDOM_TEST_GUID,
                    p: undefined,
                    q: undefined,
                    client_claims: undefined,
                };

                expect(payload).toEqual(expectedPayload);
                done();
                return Promise.resolve("");
            };
            popTokenGenerator.signPopToken(
                accessToken,
                TEST_POP_VALUES.KID,
                testRequest
            );
        });
    });
});
