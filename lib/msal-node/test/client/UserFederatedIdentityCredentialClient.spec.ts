/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    ClientConfiguration,
    Constants,
    AADServerParamKeys,
} from "@azure/msal-common";
import {
    AUTHENTICATION_RESULT_DEFAULT_SCOPES,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import { ClientTestUtils } from "./ClientTestUtils.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { UserFederatedIdentityCredentialClient } from "../../src/client/UserFederatedIdentityCredentialClient.js";
import { UserFederatedIdentityCredentialRequest } from "../../src/request/UserFederatedIdentityCredentialRequest.js";

describe("UserFederatedIdentityCredentialClient tests", () => {
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

    describe("Protocol correctness", () => {
        it("sends grant_type=user_fic", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: "test-instance-token",
                userObjectId: "test-user-object-id",
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(
                `${AADServerParamKeys.GRANT_TYPE}=${Constants.GrantType.USER_FIC}`
            );
        });

        it("includes user_federated_identity_credential parameter", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);
            const assertionValue = "test-instance-token-assertion";

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: assertionValue,
                userObjectId: "test-user-object-id",
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(
                `${AADServerParamKeys.USER_FEDERATED_IDENTITY_CREDENTIAL}=${assertionValue}`
            );
        });

        it("sends client_info=1 in the request body", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: "test-instance-token",
                userObjectId: "test-user-object-id",
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain("client_info=1");
        });

        it("includes client_id in request body", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: "test-instance-token",
                userObjectId: "test-user-object-id",
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(
                `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
            );
        });

        it("includes client_secret when configured", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: "test-instance-token",
                userObjectId: "test-user-object-id",
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(
                `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
            );
        });

        it("returns authentication result on success", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: "test-instance-token",
                userObjectId: "test-user-object-id",
            };

            const result = (await client.acquireToken(
                request
            )) as AuthenticationResult;
            expect(result).not.toBeNull();
            expect(result.accessToken).toEqual(
                AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token
            );
        });
    });

    describe("User identification mutual exclusion", () => {
        it("includes user_id when userObjectId is provided", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);
            const userObjectId = "00000000-0000-0000-0000-000000000001";

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: "test-instance-token",
                userObjectId: userObjectId,
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(
                `${AADServerParamKeys.USER_ID}=${userObjectId}`
            );
            expect(returnVal).not.toContain(
                `${AADServerParamKeys.USERNAME}=`
            );
        });

        it("includes username when username is provided", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);
            const username = "testuser@contoso.com";

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: "test-instance-token",
                username: username,
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(
                `${AADServerParamKeys.USERNAME}=${encodeURIComponent(username)}`
            );
            expect(returnVal).not.toContain(
                `${AADServerParamKeys.USER_ID}=`
            );
        });
    });

    describe("Scope augmentation", () => {
        it("augments scopes with OIDC default scopes (openid, profile, offline_access)", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: ["User.Read"],
                assertion: "test-instance-token",
                userObjectId: "test-user-object-id",
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain("openid");
            expect(returnVal).toContain("profile");
            expect(returnVal).toContain("offline_access");
            expect(returnVal).toContain("User.Read");
        });
    });

    describe("Cache behavior", () => {
        it("always hits the network (no built-in silent lookup)", async () => {
            const executePostSpy = jest.spyOn(
                UserFederatedIdentityCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            );

            const client = new UserFederatedIdentityCredentialClient(config);

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: "test-instance-token",
                userObjectId: "test-user-object-id",
            };

            // First call
            await client.acquireToken(request);
            expect(executePostSpy).toHaveBeenCalledTimes(1);

            // Second call — should still hit network (no built-in cache)
            await client.acquireToken(request);
            expect(executePostSpy).toHaveBeenCalledTimes(2);
        });

        it("stores token in user cache with account info (from client_info response)", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: "test-instance-token",
                userObjectId: "test-user-object-id",
            };

            const result = (await client.acquireToken(request)) as AuthenticationResult;
            expect(result).not.toBeNull();
            // AUTHENTICATION_RESULT_DEFAULT_SCOPES includes client_info,
            // so account should be populated
            expect(result.account).not.toBeNull();
            if (result.account) {
                expect(result.account.homeAccountId).toBeDefined();
                expect(result.account.homeAccountId.length).toBeGreaterThan(0);
            }
        });
    });

    describe("Client assertion", () => {
        it("uses per-request clientAssertion when provided", async () => {
            const assertionCallback = jest.fn().mockResolvedValue("per-request-assertion");
            const client = new UserFederatedIdentityCredentialClient(config);

            const request: UserFederatedIdentityCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                assertion: "test-instance-token",
                userObjectId: "test-user-object-id",
                clientAssertion: {
                    assertion: assertionCallback,
                    assertionType:
                        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                },
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(
                `${AADServerParamKeys.CLIENT_ASSERTION}=per-request-assertion`
            );
            expect(returnVal).toContain(
                `${AADServerParamKeys.CLIENT_ASSERTION_TYPE}=`
            );
        });
    });
});
