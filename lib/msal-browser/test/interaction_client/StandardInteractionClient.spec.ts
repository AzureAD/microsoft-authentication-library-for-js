/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { ResponseMode, AuthenticationScheme, AzureCloudOptions, AzureCloudInstance, Authority } from "@azure/msal-common";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { StandardInteractionClient } from "../../src/interaction_client/StandardInteractionClient";
import { EndSessionRequest } from "../../src/request/EndSessionRequest";
import { TEST_CONFIG, TEST_STATE_VALUES, TEST_URIS, DEFAULT_TENANT_DISCOVERY_RESPONSE, DEFAULT_OPENID_CONFIG_RESPONSE } from "../utils/StringConstants";
import { AuthorizationUrlRequest } from "../../src/request/AuthorizationUrlRequest";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { FetchClient } from "../../src/network/FetchClient";

class testStandardInteractionClient extends StandardInteractionClient {
    acquireToken(): Promise<void> {
        return Promise.resolve();
    }

    async initializeAuthorizationCodeRequest(request: AuthorizationUrlRequest) {
        return super.initializeAuthorizationCodeRequest(request);
    }

    async getDiscoveredAuthority(requestAuthority?: string, requestAzureCloudOptions?: AzureCloudOptions) {
        return super.getDiscoveredAuthority(requestAuthority, requestAzureCloudOptions);
    }

    logout(request: EndSessionRequest): Promise<void> {
        return this.clearCacheOnLogout(request.account);
    }
}

describe("StandardInteractionClient", () => {
    let pca: PublicClientApplication;
    let testClient: testStandardInteractionClient;

    beforeEach(() => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });
        // @ts-ignore
        testClient = new testStandardInteractionClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, null, pca.performanceClient);
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").returns(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(FetchClient.prototype, "sendGetRequestAsync").callsFake((url) => {
            if (url.startsWith("https://login.microsoftonline.com/common/discovery/instance?")) {
                return Promise.resolve(DEFAULT_TENANT_DISCOVERY_RESPONSE);
            } else {
                return Promise.reject({headers: {}, status: 404, body: {}});
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("initializeAuthorizationCodeRequest", async () => {

        const request: AuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            loginHint: "AbeLi@microsoft.com",
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
            nonce: "",
            authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
        };

        sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
            challenge: TEST_CONFIG.TEST_CHALLENGE,
            verifier: TEST_CONFIG.TEST_VERIFIER
        });

        const authCodeRequest = await testClient.initializeAuthorizationCodeRequest(request);
        expect(request.codeChallenge).toBe(TEST_CONFIG.TEST_CHALLENGE);
        expect(authCodeRequest.codeVerifier).toBe(TEST_CONFIG.TEST_VERIFIER);
    });

    it("getDiscoveredAuthority - request authority only", async () => {

        const reqAuthority = TEST_CONFIG.validAuthority;

        const authority = await testClient.getDiscoveredAuthority(reqAuthority);
        expect(authority.canonicalAuthority).toBe(TEST_CONFIG.validAuthority);
    });

    it("getDiscoveredAuthority - azureCloudOptions set", async () => {

        const reqAuthority = TEST_CONFIG.validAuthority;
        const reqAzureCloudOptions: AzureCloudOptions = {
            azureCloudInstance: AzureCloudInstance.AzureUsGovernment,
            tenant: TEST_CONFIG.TENANT
        };

        const authority = await testClient.getDiscoveredAuthority(reqAuthority, reqAzureCloudOptions);
        expect(authority.canonicalAuthority).toBe(TEST_CONFIG.usGovAuthority);
    });

    it("getDiscoveredAuthority - Config defaults", async () => {

        const authority = await testClient.getDiscoveredAuthority();
        expect(authority.canonicalAuthority).toBe(TEST_CONFIG.validAuthority);
    });

    it("getDiscoveredAuthority - Only azureCloudInstance provided ", async () => {

        const reqAzureCloudOptions: AzureCloudOptions = {
            azureCloudInstance: AzureCloudInstance.AzureGermany
        };
        const authority = await testClient.getDiscoveredAuthority(undefined, reqAzureCloudOptions);
        expect(authority.canonicalAuthority).toBe(TEST_CONFIG.germanyAuthority);
    });

});
