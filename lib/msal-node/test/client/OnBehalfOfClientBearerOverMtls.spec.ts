/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Authority,
    AuthorityOptions,
    ClientConfiguration,
    Logger,
    MtlsBindingCertificate,
    NetworkResponse,
    ProtocolMode,
    ServerAuthorizationTokenResponse,
    StubPerformanceClient,
} from "@azure/msal-common";
import {
    AUTHENTICATION_RESULT,
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import {
    ClientTestUtils,
    MockStorageClass,
    mockCrypto,
} from "./ClientTestUtils.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { CommonOnBehalfOfRequest } from "../../src/request/CommonOnBehalfOfRequest.js";
import { OnBehalfOfClient } from "../../src/client/OnBehalfOfClient.js";
import { HttpClient } from "../../src/network/HttpClient.js";
import { x5cToPem } from "../../src/utils/MtlsCertificateUtils.js";

const TENANT_ID = "3338040d-6c67-4c5b-b112-36a304b66dad";
const TENANTED_AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`;

const APP_CERT: MtlsBindingCertificate = {
    x5c: Buffer.from("sni-leaf-cert-der-bytes").toString("base64"),
    privateKey:
        "-----BEGIN PRIVATE KEY-----\nsni-private-key\n-----END PRIVATE KEY-----\n",
};

const CLIENT_ASSERTION = {
    assertion: "MOCK.CLIENT.ASSERTION",
    assertionType: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
};

const BEARER_NETWORK_RESPONSE: NetworkResponse<ServerAuthorizationTokenResponse> =
    {
        headers: {},
        body: AUTHENTICATION_RESULT.body as ServerAuthorizationTokenResponse,
        status: 200,
    };

async function resolveTenantedAuthority(): Promise<Authority> {
    const mockStorage = new MockStorageClass(
        TEST_CONFIG.MSAL_CLIENT_ID,
        mockCrypto,
        new Logger({}),
        new StubPerformanceClient()
    );
    const authorityOptions: AuthorityOptions = {
        protocolMode: ProtocolMode.AAD,
        knownAuthorities: [TENANTED_AUTHORITY],
        cloudDiscoveryMetadata: "",
        authorityMetadata: "",
    };
    const authority = new Authority(
        TENANTED_AUTHORITY,
        mockNetworkClient(
            DEFAULT_OPENID_CONFIG_RESPONSE.body,
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
        ),
        mockStorage,
        authorityOptions,
        new Logger({ loggerCallback: (): void => {} }),
        TEST_CONFIG.CORRELATION_ID,
        new StubPerformanceClient()
    );
    await authority.resolveEndpointsAsync();
    return authority;
}

async function buildConfig(
    clientCredentials: ClientConfiguration["clientCredentials"]
): Promise<{ config: ClientConfiguration; postSpy: jest.SpyInstance }> {
    const config = await ClientTestUtils.createTestClientConfiguration(
        undefined,
        mockNetworkClient(
            DEFAULT_OPENID_CONFIG_RESPONSE.body,
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
        )
    );

    const httpClient = new HttpClient();
    const postSpy = jest
        .spyOn(httpClient, "sendPostRequestAsync")
        .mockResolvedValue(BEARER_NETWORK_RESPONSE);
    jest.spyOn(httpClient, "sendGetRequestAsync").mockResolvedValue(
        DEFAULT_OPENID_CONFIG_RESPONSE.body as never
    );

    config.authOptions.authority = await resolveTenantedAuthority();
    config.networkInterface = httpClient;
    config.clientCredentials = clientCredentials;

    return { config, postSpy };
}

const oboRequest = (): CommonOnBehalfOfRequest => ({
    authority: TENANTED_AUTHORITY,
    correlationId: TEST_CONFIG.CORRELATION_ID,
    oboAssertion: "user_assertion_hash",
    scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE],
    skipCache: true,
});

/**
 * Request-capture: the fake Bearer token cannot always be turned into a cached account, so response
 * handling may reject. The outbound request is captured before that, and the wire contract is asserted
 * on the captured request regardless (mirrors the .NET recording-HttpClient pattern for user flows).
 */
async function captureRequest(
    client: OnBehalfOfClient,
    request: CommonOnBehalfOfRequest
): Promise<void> {
    try {
        await client.acquireToken(request);
    } catch (e) {
        // swallow — assertions run against the captured request
    }
}

describe("OnBehalfOfClient Bearer-over-mTLS (sendCertificateOverMtls)", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("routes to the mTLS endpoint and sends the on_behalf_of grant with client_assertion when the flag is set", async () => {
        const { config, postSpy } = await buildConfig({
            mtlsBindingCertificate: APP_CERT,
            clientAssertion: CLIENT_ASSERTION,
            sendCertificateOverMtls: true,
        });
        const client = new OnBehalfOfClient(config);

        await captureRequest(client, oboRequest());

        const endpoint = postSpy.mock.calls[0][0] as string;
        expect(endpoint).toContain("mtlsauth.microsoft.com");
        expect(endpoint).toContain(TENANT_ID);

        const body = postSpy.mock.calls[0][1]?.body as string;
        expect(body).toContain("requested_token_use=on_behalf_of");
        expect(body).toContain("client_assertion=");
        expect(body).not.toContain("req_cnf");
    });

    it("presents the configured certificate on the TLS connection", async () => {
        const { config, postSpy } = await buildConfig({
            mtlsBindingCertificate: APP_CERT,
            clientAssertion: CLIENT_ASSERTION,
            sendCertificateOverMtls: true,
        });
        const client = new OnBehalfOfClient(config);

        await captureRequest(client, oboRequest());

        expect(postSpy.mock.calls[0][1]?.mtlsCertificate).toEqual({
            cert: x5cToPem(APP_CERT.x5c),
            key: APP_CERT.privateKey,
        });
    });

    it("uses the regular login endpoint when the flag is unset (negative)", async () => {
        const { config, postSpy } = await buildConfig({
            mtlsBindingCertificate: APP_CERT,
            clientAssertion: CLIENT_ASSERTION,
        });
        const client = new OnBehalfOfClient(config);

        await captureRequest(client, oboRequest());

        const endpoint = postSpy.mock.calls[0][0] as string;
        expect(endpoint).toContain("login.microsoftonline.com");
        expect(endpoint).not.toContain("mtlsauth.microsoft.com");
        expect(postSpy.mock.calls[0][1]?.mtlsCertificate).toBeUndefined();
    });
});
