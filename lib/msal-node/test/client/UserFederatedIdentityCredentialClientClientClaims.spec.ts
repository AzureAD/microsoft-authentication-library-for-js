/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration, AADServerParamKeys } from "@azure/msal-common";
import {
    AUTHENTICATION_RESULT_DEFAULT_SCOPES,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import { ClientTestUtils } from "./ClientTestUtils.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { UserFederatedIdentityCredentialClient } from "../../src/client/UserFederatedIdentityCredentialClient.js";
import { CommonUserFederatedIdentityCredentialRequest } from "../../src/request/CommonUserFederatedIdentityCredentialRequest.js";

// A simple NSP-style claims payload.
const NSP_CLAIMS = '{"xms_az_nwperimid":{"essential":true}}';
// A server-issued challenge.
const SERVER_CLAIMS = '{"access_token":{"nbf":{"essential":true}}}';

const baseRequest = (): CommonUserFederatedIdentityCredentialRequest => ({
    authority: TEST_CONFIG.validAuthority,
    correlationId: TEST_CONFIG.CORRELATION_ID,
    scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
    assertion: "test-instance-token",
    userObjectId: "test-user-object-id",
});

describe("UserFederatedIdentityCredentialClient clientClaims tests", () => {
    let createTokenRequestBodySpy: jest.SpyInstance;
    let config: ClientConfiguration;

    beforeEach(async () => {
        createTokenRequestBodySpy = jest.spyOn(
            UserFederatedIdentityCredentialClient.prototype,
            <any>"createTokenRequestBody"
        );

        config = await ClientTestUtils.createTestClientConfiguration(
            undefined,
            mockNetworkClient(
                DEFAULT_OPENID_CONFIG_RESPONSE.body,
                AUTHENTICATION_RESULT_DEFAULT_SCOPES
            )
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Body injection", () => {
        it("merges clientClaims into the claims body parameter", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            await client.acquireToken({
                ...baseRequest(),
                clientClaims: NSP_CLAIMS,
            });

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(`${AADServerParamKeys.CLAIMS}=`);
            expect(returnVal).toContain("xms_az_nwperimid");
        });

        it("merges server claims and clientClaims into the claims body parameter", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            await client.acquireToken({
                ...baseRequest(),
                claims: SERVER_CLAIMS,
                clientClaims: NSP_CLAIMS,
            });

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(`${AADServerParamKeys.CLAIMS}=`);
            // both the server-issued claim and the client claim must be present
            expect(returnVal).toContain("xms_az_nwperimid");
            expect(returnVal).toContain("nbf");
        });

        it("does not include the claims body parameter when clientClaims is not set", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            await client.acquireToken(baseRequest());

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).not.toContain(`${AADServerParamKeys.CLAIMS}=`);
        });

        it("treats whitespace-only clientClaims as absent (no claims body parameter)", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            await client.acquireToken({
                ...baseRequest(),
                clientClaims: "   ",
            });

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).not.toContain(`${AADServerParamKeys.CLAIMS}=`);
        });
    });
});
