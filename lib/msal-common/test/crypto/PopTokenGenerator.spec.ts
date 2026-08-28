import {
    RANDOM_TEST_GUID,
    TEST_POP_VALUES,
    TEST_CONFIG,
    TEST_URIS,
} from "../test_kit/StringConstants.js";
import { PopTokenGenerator } from "../../src/crypto/PopTokenGenerator.js";
import { ICrypto } from "../../src/crypto/ICrypto.js";
import { BaseAuthRequest } from "../../src/request/BaseAuthRequest.js";
import * as TimeUtils from "../../src/utils/TimeUtils.js";
import { UrlString } from "../../src/url/UrlString.js";
import { AuthenticationScheme } from "../../src/utils/Constants.js";
import { Logger } from "../../src/logger/Logger.js";
import { mockCrypto } from "../client/ClientTestUtils.js";
import { StubPerformanceClient } from "../../src/index.js";
import { ITokenBindingKeyManager } from "../../src/crypto/ITokenBindingKeyManager.js";

describe("PopTokenGenerator Unit Tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const cryptoInterface: ICrypto = mockCrypto;
    const tokenBindingKeyManager: ITokenBindingKeyManager = {
        provisionTokenBindingKey: jest
            .fn()
            .mockResolvedValue(TEST_POP_VALUES.KID),
        removeTokenBindingKey: jest.fn().mockResolvedValue(undefined),
        getTokenBindingPublicKeyJwk: jest.fn().mockResolvedValue({
            kty: "RSA",
            alg: "RS256",
        }),
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
            const popTokenGenerator = new PopTokenGenerator(
                cryptoInterface,
                tokenBindingKeyManager,
                new StubPerformanceClient()
            );
            const provisionTokenBindingKeySpy = jest.spyOn(
                tokenBindingKeyManager,
                "provisionTokenBindingKey"
            );
            const reqCnfData = await popTokenGenerator.generateCnf(
                testRequest,
                new Logger({})
            );
            expect(provisionTokenBindingKeySpy).toHaveBeenCalledWith({
                correlationId: TEST_CONFIG.CORRELATION_ID,
                tokenBindingKeyType: "shr",
                tokenBindingKeyAlgorithm: "RS256",
            });
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
        });

        beforeEach(() => {
            /*
             * Freeze the clock before every test, not once in beforeAll. The
             * outer afterEach calls jest.restoreAllMocks(), which would remove a
             * beforeAll spy after the first test and leave the remaining tests
             * reading the real clock -- racing the timestamp that signPopToken
             * generates internally and failing whenever the two reads land on
             * either side of a second boundary.
             */
            jest.spyOn(TimeUtils, "nowSeconds").mockReturnValue(currTime);
        });

        it("Signs the proof-of-possession JWT token with all PoP parameters in the request", (done) => {
            const popTokenGenerator = new PopTokenGenerator(
                cryptoInterface,
                tokenBindingKeyManager,
                new StubPerformanceClient()
            );
            const accessToken = TEST_POP_VALUES.SAMPLE_POP_AT;
            const resourceReqMethod = "POST";
            const resourceUrl = TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS;
            const resourceUrlString = new UrlString(resourceUrl, "");
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

            jest.spyOn(
                cryptoInterface,
                "signTokenBindingJwt"
            ).mockImplementation((header, payload, kid, correlationId) => {
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
                    cnf: {
                        jwk: {
                            kty: "RSA",
                            alg: "RS256",
                        },
                    },
                };

                expect(header).toEqual({
                    typ: "pop",
                    alg: "RS256",
                    kid: cryptoInterface.base64UrlEncode(
                        JSON.stringify({ kid: TEST_POP_VALUES.KID })
                    ),
                });
                expect(payload).toEqual(expectedPayload);
                expect(correlationId).toBe(TEST_CONFIG.CORRELATION_ID);
                done();
                return Promise.resolve("");
            });
            popTokenGenerator.signPopToken(
                accessToken,
                TEST_POP_VALUES.KID,
                popRequest
            );
        });

        it("Signs the proof-of-possession JWT token when PoP parameters are undefined", (done) => {
            const popTokenGenerator = new PopTokenGenerator(
                cryptoInterface,
                tokenBindingKeyManager,
                new StubPerformanceClient()
            );
            const accessToken = TEST_POP_VALUES.SAMPLE_POP_AT;
            const currTime = TimeUtils.nowSeconds();
            jest.spyOn(
                cryptoInterface,
                "signTokenBindingJwt"
            ).mockImplementation((header, payload, kid, correlationId) => {
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
                    cnf: {
                        jwk: {
                            kty: "RSA",
                            alg: "RS256",
                        },
                    },
                };

                expect(header).toEqual({
                    typ: "pop",
                    alg: "RS256",
                    kid: cryptoInterface.base64UrlEncode(
                        JSON.stringify({ kid: TEST_POP_VALUES.KID })
                    ),
                });
                expect(payload).toEqual(expectedPayload);
                expect(correlationId).toBe(TEST_CONFIG.CORRELATION_ID);
                done();
                return Promise.resolve("");
            });
            popTokenGenerator.signPopToken(
                accessToken,
                TEST_POP_VALUES.KID,
                testRequest
            );
        });

        it("falls back to caller and default SHR algorithms when public JWK alg is missing", async () => {
            const popTokenGenerator = new PopTokenGenerator(
                cryptoInterface,
                tokenBindingKeyManager,
                new StubPerformanceClient()
            );
            jest.spyOn(
                tokenBindingKeyManager,
                "getTokenBindingPublicKeyJwk"
            ).mockResolvedValue({
                kty: "RSA",
            });
            const signTokenBindingJwtSpy = jest
                .spyOn(cryptoInterface, "signTokenBindingJwt")
                .mockResolvedValue("");

            await popTokenGenerator.signPopToken(
                TEST_POP_VALUES.SAMPLE_POP_AT,
                TEST_POP_VALUES.KID,
                {
                    ...testRequest,
                    shrOptions: {
                        header: {
                            alg: "RS256",
                        },
                    },
                }
            );
            expect(signTokenBindingJwtSpy.mock.calls[0][0]).toMatchObject({
                alg: "RS256",
            });

            await popTokenGenerator.signPopToken(
                TEST_POP_VALUES.SAMPLE_POP_AT,
                TEST_POP_VALUES.KID,
                testRequest
            );
            expect(signTokenBindingJwtSpy.mock.calls[1][0]).toMatchObject({
                alg: "RS256",
            });
        });
    });
});
