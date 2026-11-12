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

describe("UserFederatedIdentityCredentialClient claimsFromClient tests", () => {
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

    it("classifies FIC tokens using the client-originated capabilities actually sent", async () => {
        const client = new UserFederatedIdentityCredentialClient(config);
        const cp1 = '{"access_token":{"xms_cc":{"values":["CP1"]}}}';
        const request = { ...baseRequest(), claimsFromClient: cp1 };
        const result = await client.acquireToken(request);
        if (!result?.account) {
            throw new Error(
                "Expected a user account in the FIC response fixture"
            );
        }
        const body = new URLSearchParams(
            await createTokenRequestBodySpy.mock.results[0].value
        );
        expect(
            JSON.parse(body.get("claims")!).access_token.xms_cc.values
        ).toEqual(["CP1"]);
        const storage = config.storageInterface!;
        expect(
            storage.getAccessToken(result.account, baseRequest())
        ).toBeNull();
        expect(
            storage.getAccessToken(result.account, {
                ...baseRequest(),
                claims: cp1,
            })?.secret
        ).toBe(result.accessToken);
    });

    describe("Body injection", () => {
        it("merges claimsFromClient into the claims body parameter", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: NSP_CLAIMS,
            });

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(`${AADServerParamKeys.CLAIMS}=`);
            expect(returnVal).toContain("xms_az_nwperimid");
        });

        it("merges server claims and claimsFromClient into the claims body parameter", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            await client.acquireToken({
                ...baseRequest(),
                claims: SERVER_CLAIMS,
                claimsFromClient: NSP_CLAIMS,
            });

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(`${AADServerParamKeys.CLAIMS}=`);
            // both the server-issued claim and the client claim must be present
            expect(returnVal).toContain("xms_az_nwperimid");
            expect(returnVal).toContain("nbf");
        });

        it("does not include the claims body parameter when claimsFromClient is not set", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            await client.acquireToken(baseRequest());

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).not.toContain(`${AADServerParamKeys.CLAIMS}=`);
        });

        it("treats whitespace-only claimsFromClient as absent (no claims body parameter)", async () => {
            const client = new UserFederatedIdentityCredentialClient(config);

            await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: "   ",
            });

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).not.toContain(`${AADServerParamKeys.CLAIMS}=`);
        });
    });
});
