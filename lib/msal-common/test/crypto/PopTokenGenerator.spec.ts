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

describe("PopTokenGenerator Unit Tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const cryptoInterface: ICrypto = mockCrypto;

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
                new StubPerformanceClient()
            );
            const getPublicKeyThumbprintSpy = jest.spyOn(
                cryptoInterface,
                "getPublicKeyThumbprint"
            );
            const reqCnfData = await popTokenGenerator.generateCnf(
                testRequest,
                new Logger({})
            );
            expect(getPublicKeyThumbprintSpy).toHaveBeenCalledWith(testRequest);
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
            const popTokenGenerator = new PopTokenGenerator(
                cryptoInterface,
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

            jest.spyOn(cryptoInterface, "signJwt").mockImplementation(
                (payload, kid, shrOptions, correlationId) => {
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
                    expect(shrOptions).toBeUndefined();
                    expect(correlationId).toBe(TEST_CONFIG.CORRELATION_ID);
                    done();
                    return Promise.resolve("");
                }
            );
            popTokenGenerator.signPopToken(
                accessToken,
                TEST_POP_VALUES.KID,
                popRequest
            );
        });

        it("Signs the proof-of-possession JWT token when PoP parameters are undefined", (done) => {
            const popTokenGenerator = new PopTokenGenerator(
                cryptoInterface,
                new StubPerformanceClient()
            );
            const accessToken = TEST_POP_VALUES.SAMPLE_POP_AT;
            const currTime = TimeUtils.nowSeconds();
            jest.spyOn(cryptoInterface, "signJwt").mockImplementation(
                (payload, kid, shrOptions, correlationId) => {
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
                    expect(shrOptions).toBeUndefined();
                    expect(correlationId).toBe(TEST_CONFIG.CORRELATION_ID);
                    done();
                    return Promise.resolve("");
                }
            );
            popTokenGenerator.signPopToken(
                accessToken,
                TEST_POP_VALUES.KID,
                testRequest
            );
        });
    });
});
