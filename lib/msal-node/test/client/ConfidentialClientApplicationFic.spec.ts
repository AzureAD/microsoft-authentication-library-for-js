/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { createClientAuthError, INetworkModule } from "@azure/msal-common";
import { DEFAULT_OPENID_CONFIG_RESPONSE } from "../utils/TestConstants.js";
import {
    ConfidentialClientApplication,
    Configuration,
} from "../../src/index.js";
import { CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT } from "../test_kit/StringConstants.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { ClientTestUtils } from "./ClientTestUtils.js";
import * as NodeClientAuthErrorCodes from "../../src/error/ClientAuthErrorCodes.js";
import { UserFederatedIdentityCredentialRequest } from "../../src/request/UserFederatedIdentityCredentialRequest.js";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("ConfidentialClientApplication FIC validation tests", () => {
    beforeAll(() => {
        jest.spyOn(jwt, <any>"sign").mockReturnValue("fake_jwt_string");
    });

    const networkClient: INetworkModule = mockNetworkClient(
        DEFAULT_OPENID_CONFIG_RESPONSE.body,
        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
    );

    let config: Configuration;
    beforeEach(async () => {
        config =
            await ClientTestUtils.createTestConfidentialClientConfiguration(
                undefined,
                networkClient
            );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("throws when both userObjectId and username are provided", async () => {
        const client = new ConfidentialClientApplication(config);

        const request = {
            scopes: ["User.Read"],
            assertion: "test-instance-token",
            userObjectId: "test-user-id",
            username: "user@contoso.com",
        } as unknown as UserFederatedIdentityCredentialRequest;

        await expect(
            client.acquireTokenByUserFederatedIdentityCredential(request)
        ).rejects.toMatchObject(
            createClientAuthError(
                NodeClientAuthErrorCodes.invalidClientCredential
            )
        );
    });

    it("throws when neither userObjectId nor username is provided", async () => {
        const client = new ConfidentialClientApplication(config);

        const request = {
            scopes: ["User.Read"],
            assertion: "test-instance-token",
        } as unknown as UserFederatedIdentityCredentialRequest;

        await expect(
            client.acquireTokenByUserFederatedIdentityCredential(request)
        ).rejects.toMatchObject(
            createClientAuthError(
                NodeClientAuthErrorCodes.invalidClientCredential
            )
        );
    });

    describe("per-request clientAssertion resolution", () => {
        it("resolves a string clientAssertion before passing to internal client", async () => {
            const { UserFederatedIdentityCredentialClient } = await import(
                "../../src/client/UserFederatedIdentityCredentialClient.js"
            );
            const acquireTokenSpy = jest
                .spyOn(
                    UserFederatedIdentityCredentialClient.prototype,
                    "acquireToken"
                )
                .mockResolvedValue(null);

            const client = new ConfidentialClientApplication(config);
            const request: UserFederatedIdentityCredentialRequest = {
                scopes: ["User.Read"],
                assertion: "test-instance-token",
                userObjectId: "test-user-id",
                clientAssertion: "string-assertion-value",
            };

            await client.acquireTokenByUserFederatedIdentityCredential(request);

            expect(acquireTokenSpy).toHaveBeenCalledTimes(1);
            const resolvedRequest = acquireTokenSpy.mock.calls[0][0];
            expect(resolvedRequest.clientAssertion).toBeDefined();
            expect(resolvedRequest.clientAssertion!.assertion).toBe(
                "string-assertion-value"
            );
            expect(resolvedRequest.clientAssertion!.assertionType).toBe(
                "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
            );
        });

        it("resolves a callback clientAssertion before passing to internal client", async () => {
            const { UserFederatedIdentityCredentialClient } = await import(
                "../../src/client/UserFederatedIdentityCredentialClient.js"
            );
            const acquireTokenSpy = jest
                .spyOn(
                    UserFederatedIdentityCredentialClient.prototype,
                    "acquireToken"
                )
                .mockResolvedValue(null);

            const assertionCallback = jest
                .fn()
                .mockResolvedValue("callback-resolved-assertion");
            const client = new ConfidentialClientApplication(config);
            const request: UserFederatedIdentityCredentialRequest = {
                scopes: ["User.Read"],
                assertion: "test-instance-token",
                userObjectId: "test-user-id",
                clientAssertion: assertionCallback,
            };

            await client.acquireTokenByUserFederatedIdentityCredential(request);

            expect(assertionCallback).toHaveBeenCalledTimes(1);
            expect(acquireTokenSpy).toHaveBeenCalledTimes(1);
            const resolvedRequest = acquireTokenSpy.mock.calls[0][0];
            expect(resolvedRequest.clientAssertion).toBeDefined();
            expect(resolvedRequest.clientAssertion!.assertion).toBe(
                "callback-resolved-assertion"
            );
        });
    });

    it("throws when assertion is empty string", async () => {
        const client = new ConfidentialClientApplication(config);

        const request: UserFederatedIdentityCredentialRequest = {
            scopes: ["User.Read"],
            assertion: "",
            userObjectId: "test-user-id",
            authority: "https://login.microsoftonline.com/common",
            correlationId: "test-correlation-id",
        };

        await expect(
            client.acquireTokenByUserFederatedIdentityCredential(request)
        ).rejects.toMatchObject(
            createClientAuthError(
                NodeClientAuthErrorCodes.invalidClientCredential
            )
        );
    });
});
