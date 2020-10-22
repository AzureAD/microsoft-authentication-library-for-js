import * as Mocha from "mocha";
import * as chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);
import { ICrypto, PkceCodes, UrlString, SignedHttpRequest, TimeUtils } from "../../src";
import { RANDOM_TEST_GUID, TEST_POP_VALUES, TEST_DATA_CLIENT_INFO, TEST_CONFIG, TEST_URIS, TEST_TOKENS } from "../utils/StringConstants";
import { PopTokenGenerator } from "../../src/crypto/PopTokenGenerator";

describe("PopTokenGenerator Unit Tests", () => {

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
        }
    };

    it("Generates the req_cnf correctly", async () => {
        const popTokenGenerator = new PopTokenGenerator(cryptoInterface);
        const req_cnf = await popTokenGenerator.generateCnf("POST", TEST_URIS.TEST_REDIR_URI);
        expect(req_cnf).to.be.eq(TEST_POP_VALUES.ENCODED_REQ_CNF);
    });

    it("Signs the proof-of-possession JWT token", (done) => {
        const popTokenGenerator = new PopTokenGenerator(cryptoInterface);
        const accessToken = TEST_POP_VALUES.SAMPLE_POP_AT;
        const resourceReqMethod = "POST";
        const resourceUrl = TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS;
        const resourceUrlString = new UrlString(resourceUrl);
        const resourceUrlComponents = resourceUrlString.getUrlComponents();
        const currTime = TimeUtils.nowSeconds();
        sinon.stub(TimeUtils, "nowSeconds").returns(currTime);
        cryptoInterface.signJwt = (payload: SignedHttpRequest, kid: string): Promise<string> => {
            expect(kid).to.be.eq(TEST_POP_VALUES.KID);
            const expectedPayload = {
                at: accessToken,
                ts: `${currTime}`,
                m: resourceReqMethod,
                u: resourceUrlComponents.HostNameAndPort,
                nonce: RANDOM_TEST_GUID,
                p: resourceUrlComponents.AbsolutePath,
                q: [[], resourceUrlComponents.QueryString]
            };
            expect(payload).to.be.deep.eq(expectedPayload);
            done();
            return null;
        };
        popTokenGenerator.signPopToken(accessToken, resourceReqMethod, resourceUrl);
    });
});
