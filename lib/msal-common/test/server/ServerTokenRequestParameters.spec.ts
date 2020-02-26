import { expect } from "chai";
import sinon from "sinon";
import { TokenExchangeParameters } from "../../src/request/TokenExchangeParameters";
import { ServerTokenRequestParameters } from "../../src/server/ServerTokenRequestParameters";
import { TEST_CONFIG, TEST_URIS, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID } from "../utils/StringConstants";
import { AadAuthority } from "../../src/auth/authority/AadAuthority";
import { PkceCodes, ICrypto } from "../../src/crypto/ICrypto";
import { NetworkRequestOptions, INetworkModule } from "../../src/network/INetworkModule";
import { Constants } from "../../src/utils/Constants";
import { CodeResponse } from "../../src/response/CodeResponse";
import { ClientConfigurationErrorMessage } from "../../src";


describe("ServerTokenRequestParameters.ts Class Unit Tests", () => {

    let networkInterface: INetworkModule;
    let cryptoInterface: ICrypto;
    let aadAuthority: AadAuthority;
    beforeEach(() => {
        networkInterface = {
            sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            },
            sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            }
        };
        cryptoInterface = {
            createNewGuid(): string {
                return RANDOM_TEST_GUID;
            },
            base64Decode(input: string): string {
                switch (input) {
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
                    case "456-test-utid":
                        return "NDU2LXRlc3QtdXRpZA==";
                    default:
                        return input;
                }
            },
            async generatePkceCodes(): Promise<PkceCodes> {
                return {
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER
                }
            }
        };
        aadAuthority = new AadAuthority(Constants.DEFAULT_AUTHORITY, networkInterface);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("correctly assigns request parameter values ", () => {
            const testScope1 = "scope1";
            const testScope2 = "scope2";
            const corrId = "thisIsCorrelationId";
            const clientSecret = "thisIsASecret";
            const tokenRequest: TokenExchangeParameters = {
                scopes: [testScope1, testScope2],
                correlationId: corrId
            };
            const codeResponse: CodeResponse = {
                code: "thisIsACode",
                userRequestState: "testState"
            };

            const tokenRequestParams = new ServerTokenRequestParameters(
                TEST_CONFIG.MSAL_CLIENT_ID,
                clientSecret,
                tokenRequest,
                codeResponse,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                null
            );
            tokenRequest.scopes.push(Constants.OFFLINE_ACCESS_SCOPE);
            expect(tokenRequestParams.xClientVer).to.be.eq("1.0.0-alpha.0");
            expect(tokenRequestParams.xClientSku).to.be.eq(Constants.LIBRARY_NAME);
            expect(tokenRequestParams.correlationId).to.be.eq(corrId);
            expect(tokenRequestParams.clientId).to.be.eq(TEST_CONFIG.MSAL_CLIENT_ID);
            expect(tokenRequestParams.scopes.printScopes()).to.be.eq(tokenRequest.scopes.join(" "));
            expect(tokenRequestParams.redirectUri).to.be.eq(TEST_URIS.TEST_REDIR_URI);
            expect(tokenRequestParams.clientSecret).to.be.eq(clientSecret);
            expect(tokenRequestParams.tokenRequest).to.be.deep.eq(tokenRequest);
            expect(tokenRequestParams.refreshToken).to.be.null;
        });

        it("throws error if scopes are not provided", () => {
            const codeResponse: CodeResponse = {
                code: "thisIsACode",
                userRequestState: "testState"
            };
            const clientSecret = "thisIsASecret";
            const tokenRequest: TokenExchangeParameters = {};
            expect(() => new ServerTokenRequestParameters(
                TEST_CONFIG.MSAL_CLIENT_ID,
                clientSecret,
                tokenRequest,
                codeResponse,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                null
            )).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });
    });
});
