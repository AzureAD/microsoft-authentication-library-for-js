/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msalNode from "../src/index.js";
import { AuthError } from "../src/common/error/AuthError.js";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
} from "../src/common/error/ClientAuthError.js";
import { NodeAuthError } from "../src/error/NodeAuthError.js";
import { ManagedIdentityError } from "../src/error/ManagedIdentityError.js";
import { buildClientConfiguration } from "../src/common/config/ClientConfiguration.js";
import { name, version } from "../src/packageMetadata.js";
import { ClientTestUtils } from "./client/ClientTestUtils.js";

describe("public API compatibility", () => {
    it("exports retained common-origin API members", () => {
        [
            "ConfidentialClientApplication",
            "ManagedIdentityApplication",
            "ClientAssertion",
            "TokenCache",
            "CryptoProvider",
            "AuthError",
            "ClientAuthError",
            "ClientConfigurationError",
            "InteractionRequiredAuthError",
            "ServerError",
            "Logger",
            "LogLevel",
            "ProtocolMode",
            "AzureCloudInstance",
            "PromptValue",
            "ResponseMode",
            "version",
        ].forEach((name) => expect(msalNode).toHaveProperty(name));
    });

    it("preserves enum-like values", () => {
        expect(msalNode.PromptValue).toEqual({
            LOGIN: "login",
            SELECT_ACCOUNT: "select_account",
            CONSENT: "consent",
            NONE: "none",
            CREATE: "create",
            NO_SESSION: "no_session",
        });
        expect(msalNode.ResponseMode).toEqual({
            QUERY: "query",
            FRAGMENT: "fragment",
            FORM_POST: "form_post",
        });
    });

    it("uses the Node-owned AuthError hierarchy and error codes", () => {
        expect(new ClientAuthError("client_error", "message")).toBeInstanceOf(
            AuthError
        );
        expect(new NodeAuthError("node_error", "message")).toBeInstanceOf(
            AuthError
        );
        expect(
            new ManagedIdentityError("managed_identity_error", "message")
        ).toBeInstanceOf(AuthError);
        expect(ClientAuthErrorCodes.tokenClaimsCnfRequiredForSignedJwt).toBe(
            "token_claims_cnf_required_for_signedjwt"
        );
    });

    it("uses Node package metadata in extracted client configuration", async () => {
        const clientConfiguration =
            await ClientTestUtils.createTestClientConfiguration();
        clientConfiguration.libraryInfo = undefined;
        const config = buildClientConfiguration(clientConfiguration);

        expect(config.libraryInfo).toEqual({
            sku: "msal.js.node",
            version,
            cpu: "",
            os: "",
        });
        expect(name).toBe("@azure/msal-node");
    });
});
