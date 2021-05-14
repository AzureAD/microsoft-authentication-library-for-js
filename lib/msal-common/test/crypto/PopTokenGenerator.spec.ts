import * as Mocha from "mocha";
import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);
import { ICrypto, PkceCodes, UrlString, SignedHttpRequest, TimeUtils, IUri, BaseAuthRequest, AuthenticationScheme } from "../../src";
import { RANDOM_TEST_GUID, TEST_POP_VALUES, TEST_DATA_CLIENT_INFO, TEST_CONFIG, TEST_URIS, TEST_TOKENS } from "../test_kit/StringConstants";
import { PopTokenGenerator } from "../../src/crypto/PopTokenGenerator";

describe("PopTokenGenerator Unit Tests", () => {

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
        async getAsymmetricPublicKey(): Promise<string> {
            return TEST_POP_VALUES.KID;
        }
    };

    describe("signPopToken", () => {
        let popTokenGenerator: PopTokenGenerator;
        let accessToken: string;
        let resourceReqMethod: string;
        let resourceUrl: string;
        let resourceUrlString: UrlString;
        let resourceUrlComponents: IUri;
        let currTime: number;
        let testRequest: BaseAuthRequest;
        
        before(() => {
            popTokenGenerator = new PopTokenGenerator(cryptoInterface);
            accessToken = TEST_POP_VALUES.SAMPLE_POP_AT;
            resourceReqMethod = "POST";
            resourceUrl = TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS;
            resourceUrlString = new UrlString(resourceUrl);
            resourceUrlComponents = resourceUrlString.getUrlComponents();
            currTime = TimeUtils.nowSeconds();
            testRequest = {
                authority: TEST_CONFIG.validAuthority,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                correlationId: TEST_CONFIG.CORRELATION_ID,
            };
            sinon.stub(TimeUtils, "nowSeconds").returns(currTime);
        });

        it("Signs the proof-of-possession JWT token with all PoP parameters in the request", async(done) => {
            const popTokenGenerator = new PopTokenGenerator(cryptoInterface);
            const accessToken = TEST_POP_VALUES.SAMPLE_POP_AT;
            const resourceReqMethod = "POST";
            const resourceUrl = TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS;
            const resourceUrlString = new UrlString(resourceUrl);
            const resourceUrlComponents = resourceUrlString.getUrlComponents();
            const currTime = TimeUtils.nowSeconds();
            const shrClaims = TEST_POP_VALUES.CLIENT_CLAIMS;

            // Set PoP parameters in auth request
            const popRequest = {
                ...testRequest,
                authenticationScheme: AuthenticationScheme.POP,
                resourceRequestMethod: resourceReqMethod,
                resourceRequestUri: resourceUrl,
                shrClaims: shrClaims
            }


            cryptoInterface.signJwt = (payload: SignedHttpRequest, kid: string): Promise<string> => {
                expect(kid).to.be.eq(TEST_POP_VALUES.KID);
                const expectedPayload = {
                    at: accessToken,
                    ts: currTime,
                    m: resourceReqMethod,
                    u: resourceUrlComponents.HostNameAndPort,
                    nonce: RANDOM_TEST_GUID,
                    p: resourceUrlComponents.AbsolutePath,
                    q: [[], resourceUrlComponents.QueryString],
                    client_claims: shrClaims
                };
                
                expect(payload).to.be.deep.eq(expectedPayload);
                done();
                return null;
            };
            popTokenGenerator.signPopToken(accessToken, popRequest);
        });

        it("Signs the proof-of-possession JWT token when PoP parameters are undefined", (done) => {
            const popTokenGenerator = new PopTokenGenerator(cryptoInterface);
            const accessToken = TEST_POP_VALUES.SAMPLE_POP_AT;
            const currTime = TimeUtils.nowSeconds();
            const popRequest = { ...testRequest, authenticationScheme: AuthenticationScheme.POP };
            cryptoInterface.signJwt = (payload: SignedHttpRequest, kid: string): Promise<string> => {
                expect(kid).to.be.eq(TEST_POP_VALUES.KID);
                const expectedPayload = {
                    at: accessToken,
                    ts: currTime,
                    m: undefined,
                    u: undefined,
                    nonce: RANDOM_TEST_GUID,
                    p: undefined,
                    q: undefined,
                    client_claims: undefined
                };
                
                expect(payload).to.be.deep.eq(expectedPayload);
                done();
                return null;
            };
            popTokenGenerator.signPopToken(accessToken, testRequest);
        });
    });
});
