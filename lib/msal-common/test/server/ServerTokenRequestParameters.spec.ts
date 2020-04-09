import { expect } from "chai";
import sinon from "sinon";
import { TokenExchangeParameters } from "../../src/request/TokenExchangeParameters";
import { ServerTokenRequestParameters } from "../../src/server/ServerTokenRequestParameters";
import { TEST_CONFIG, TEST_URIS, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_TOKENS } from "../utils/StringConstants";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { PkceCodes, ICrypto } from "../../src/crypto/ICrypto";
import { NetworkRequestOptions, INetworkModule } from "../../src/network/INetworkModule";
import { Constants, HeaderNames, AADServerParamKeys } from "../../src/utils/Constants";
import { CodeResponse } from "../../src/response/CodeResponse";
import { ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { ClientAuthErrorMessage, ClientAuthError } from "../../src/error/ClientAuthError";

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
            expect(tokenRequestParams.tokenRequest).to.be.deep.eq(tokenRequest);
            expect(tokenRequestParams.refreshToken).to.be.null;
        });

        it("throws error if scopes are not provided", () => {
            const codeResponse: CodeResponse = {
                code: "thisIsACode",
                userRequestState: "testState"
            };
            const tokenRequest: TokenExchangeParameters = {};
            expect(() => new ServerTokenRequestParameters(
                TEST_CONFIG.MSAL_CLIENT_ID,
                tokenRequest,
                codeResponse,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                null
            )).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });
    });

    describe("createRequestHeaders()" , () => {

        it("Returns string:string map that contains default headers", () => {
            const testScope1 = "scope1";
            const testScope2 = "scope2";
            const tokenRequest: TokenExchangeParameters = {
                scopes: [testScope1, testScope2],
            };
            const codeResponse: CodeResponse = {
                code: "thisIsACode",
                userRequestState: "testState"
            };

            const tokenRequestParams = new ServerTokenRequestParameters(
                TEST_CONFIG.MSAL_CLIENT_ID,
                tokenRequest,
                codeResponse,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                null
            );
            const headers = tokenRequestParams.createRequestHeaders();
            expect(headers instanceof Map).to.be.true;
            expect(headers.size).to.be.eq(1);
            expect(headers.get(HeaderNames.CONTENT_TYPE)).to.be.eq(Constants.URL_FORM_CONTENT_TYPE);
        })
    });

    describe("createRequestBody()", () => {

        it("throws an error if both codeResponse and refresh token are null or empty", () => {
            const testScope1 = "scope1";
            const testScope2 = "scope2";
            const tokenRequest: TokenExchangeParameters = {
                scopes: [testScope1, testScope2],
            };

            const tokenRequestParams = new ServerTokenRequestParameters(
                TEST_CONFIG.MSAL_CLIENT_ID,
                tokenRequest,
                null,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                null
            );
            expect(() => tokenRequestParams.createRequestBody()).to.throw(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
            expect(() => tokenRequestParams.createRequestBody()).to.throw(ClientAuthError);
        });

        it("creates a string of query params created from CodeResponse to send in request body", () => {
            const testScope1 = "scope1";
            const testScope2 = "scope2";
            const tokenRequest: TokenExchangeParameters = {
                scopes: [testScope1, testScope2],
                codeVerifier: "verifyThatCode"
            };
            const codeResponse: CodeResponse = {
                code: "thisIsACode",
                userRequestState: "testState"
            };

            const tokenRequestParams = new ServerTokenRequestParameters(
                TEST_CONFIG.MSAL_CLIENT_ID,
                tokenRequest,
                codeResponse,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                null
            );
            tokenRequest.scopes.push(Constants.OFFLINE_ACCESS_SCOPE);
            const reqParams = tokenRequestParams.createRequestBody();
            const expectedClientIdString = `${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`;
            const expectedScopeString = `${AADServerParamKeys.SCOPE}=${encodeURIComponent(tokenRequestParams.scopes.printScopes())}`;
            const expectedRedirectUriString = `${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`;
            const expectedAuthCodeString = `${AADServerParamKeys.CODE}=${encodeURIComponent(codeResponse.code)}`;
            const expectedCodeVerifierString = `${AADServerParamKeys.CODE_VERIFIER}=${encodeURIComponent(tokenRequest.codeVerifier)}`;
            const expectedGrantTypeString = `${AADServerParamKeys.GRANT_TYPE}=${Constants.CODE_GRANT_TYPE}`;
            expect(reqParams).to.be.include(expectedClientIdString);
            expect(reqParams).to.be.include(expectedScopeString);
            expect(reqParams).to.be.include(expectedRedirectUriString);
            expect(reqParams).to.be.include(expectedAuthCodeString);
            expect(reqParams).to.be.include(expectedCodeVerifierString);
            expect(reqParams).to.be.include(expectedGrantTypeString);
            expect(reqParams).to.be.eq(`${expectedClientIdString}&${expectedScopeString}&${expectedRedirectUriString}&${expectedAuthCodeString}&${expectedCodeVerifierString}&${expectedGrantTypeString}`);
        });

        it("creates a string of query params created from refresh token to send in request body", () => {
            const testScope1 = "scope1";
            const testScope2 = "scope2";
            const tokenRequest: TokenExchangeParameters = {
                scopes: [testScope1, testScope2],
            };

            const tokenRequestParams = new ServerTokenRequestParameters(
                TEST_CONFIG.MSAL_CLIENT_ID,
                tokenRequest,
                null,
                TEST_URIS.TEST_REDIR_URI,
                cryptoInterface,
                TEST_TOKENS.REFRESH_TOKEN
            );
            tokenRequest.scopes.push(Constants.OFFLINE_ACCESS_SCOPE);
            const reqParams = tokenRequestParams.createRequestBody();
            const expectedClientIdString = `${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`;
            const expectedScopeString = `${AADServerParamKeys.SCOPE}=${encodeURIComponent(tokenRequestParams.scopes.printScopes())}`
            const expectedRedirectUriString = `${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`;
            const expectedRefreshTokenString = `${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`;
            const expectedGrantTypeString = `${AADServerParamKeys.GRANT_TYPE}=${Constants.RT_GRANT_TYPE}`;
            expect(reqParams).to.be.include(expectedClientIdString);
            expect(reqParams).to.be.include(expectedScopeString);
            expect(reqParams).to.be.include(expectedRedirectUriString);
            expect(reqParams).to.be.include(expectedRefreshTokenString);
            expect(reqParams).to.be.include(expectedGrantTypeString);
            expect(reqParams).to.be.eq(`${expectedClientIdString}&${expectedScopeString}&${expectedRedirectUriString}&${expectedRefreshTokenString}&${expectedGrantTypeString}`)
        });
    });
});
