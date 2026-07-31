/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, INetworkModule } from "@azure/msal-common";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONSTANTS,
} from "../utils/TestConstants.js";
import { CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT } from "../test_kit/StringConstants.js";
import { ClientTestUtils } from "./ClientTestUtils.js";
import {
    ConfidentialClientApplication,
    Configuration,
    RefreshTokenRequest,
    AuthorizationCodeRequest,
    OnBehalfOfRequest,
    ClientCredentialRequest,
} from "../../src/index.js";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

/**
 * End-to-end coverage that the app-level auth.clientCertificate.sendCertificateOverMtls flag threads
 * through buildOauthClientConfiguration to EVERY confidential flow (client-credentials, OBO,
 * refresh-token, auth-code): the request is routed to the mTLS token endpoint, the certificate is
 * presented on the connection, and a private_key_jwt client_assertion is sent while token_type stays
 * Bearer. jsonwebtoken is mocked, so the certificate-derived assertion is a stub string.
 */
describe("ConfidentialClientApplication Bearer-over-mTLS (sendCertificateOverMtls)", () => {
    beforeAll(() => {
        jest.spyOn(jwt, <any>"sign").mockReturnValue("fake_jwt_string");
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    async function buildApp(sendCertificateOverMtls: boolean): Promise<{
        app: ConfidentialClientApplication;
        postSpy: jest.Mock;
    }> {
        const postSpy = jest.fn(
            async () => CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
        );
        const networkClient: INetworkModule = {
            sendGetRequestAsync: jest.fn(
                async () => DEFAULT_OPENID_CONFIG_RESPONSE.body as any
            ),
            sendPostRequestAsync: postSpy as any,
        };

        const config: Configuration =
            await ClientTestUtils.createTestConfidentialClientConfiguration(
                undefined,
                networkClient
            );
        config.auth.clientCertificate = {
            thumbprintSha256: TEST_CONSTANTS.THUMBPRINT256,
            privateKey: TEST_CONSTANTS.PRIVATE_KEY,
            x5c: TEST_CONSTANTS.PUBLIC_CERTIFICATE,
            sendCertificateOverMtls,
        };

        return {
            app: new ConfidentialClientApplication(config),
            postSpy,
        };
    }

    /** Returns the endpoint + options of the token POST (the only POST; discovery uses GET). */
    function tokenPost(postSpy: jest.Mock): {
        endpoint: string;
        body: string;
        mtlsCertificate: any;
    } {
        const [endpoint, options] = postSpy.mock.calls[0];
        return {
            endpoint: endpoint as string,
            body: options?.body as string,
            mtlsCertificate: options?.mtlsCertificate,
        };
    }

    function assertBearerOverMtls(
        postSpy: jest.Mock,
        grantMarker: string
    ): void {
        const { endpoint, body, mtlsCertificate } = tokenPost(postSpy);
        expect(endpoint).toContain("mtlsauth.microsoft.com");
        expect(endpoint).toContain("tenantid");
        expect(body).toContain(grantMarker);
        expect(body).toContain("client_assertion=");
        expect(body).not.toContain("req_cnf");
        expect(mtlsCertificate).toBeDefined();
        expect(mtlsCertificate.key).toEqual(TEST_CONSTANTS.PRIVATE_KEY);
        expect(mtlsCertificate.cert).toContain("BEGIN CERTIFICATE");
    }

    test("client-credentials routes to the mTLS endpoint with a Bearer + client_assertion", async () => {
        const { app, postSpy } = await buildApp(true);
        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: true,
        };

        (await app.acquireTokenByClientCredential(
            request
        )) as AuthenticationResult;

        assertBearerOverMtls(postSpy, "grant_type=client_credentials");
    });

    test("on-behalf-of routes to the mTLS endpoint with the on_behalf_of grant", async () => {
        const { app, postSpy } = await buildApp(true);
        const request: OnBehalfOfRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            oboAssertion: "user_assertion_hash",
            skipCache: true,
        };

        await app.acquireTokenOnBehalfOf(request);

        assertBearerOverMtls(postSpy, "requested_token_use=on_behalf_of");
    });

    test("refresh-token routes to the mTLS endpoint with the refresh_token grant", async () => {
        const { app, postSpy } = await buildApp(true);
        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        await app.acquireTokenByRefreshToken(request);

        assertBearerOverMtls(postSpy, "grant_type=refresh_token");
    });

    test("auth-code routes to the mTLS endpoint with the authorization_code grant", async () => {
        const { app, postSpy } = await buildApp(true);
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
        };

        await app.acquireTokenByCode(request);

        assertBearerOverMtls(postSpy, "grant_type=authorization_code");
    });

    test("does not route to the mTLS endpoint when the flag is unset (negative)", async () => {
        const { app, postSpy } = await buildApp(false);
        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        await app.acquireTokenByRefreshToken(request);

        const { endpoint, mtlsCertificate } = tokenPost(postSpy);
        expect(endpoint).toContain("login.microsoftonline.com");
        expect(endpoint).not.toContain("mtlsauth.microsoft.com");
        expect(mtlsCertificate).toBeUndefined();
    });
});
