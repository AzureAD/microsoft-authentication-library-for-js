/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as confidential from "../../src/confidential/index.js";
import {
    ConfidentialClientApplication,
    ManagedIdentityApplication,
    ClientAssertion,
    TokenCache,
    DistributedCachePlugin,
    ManagedIdentitySourceNames,
    CryptoProvider,
    PromptValue,
    ResponseMode,
} from "../../src/index.js";

describe("@azure/msal-node/confidential exports", () => {
    it("exports confidential and managed identity runtime surfaces", () => {
        expect(confidential).toEqual(
            expect.objectContaining({
                ConfidentialClientApplication,
                ManagedIdentityApplication,
                ClientAssertion,
                TokenCache,
                DistributedCachePlugin,
                ManagedIdentitySourceNames,
                CryptoProvider,
                PromptValue,
                ResponseMode,
            })
        );
    });

    it("does not export PCA-only runtime surfaces", () => {
        const exportNames = Object.keys(confidential);

        expect(exportNames).not.toContain("PublicClientApplication");
    });
});
