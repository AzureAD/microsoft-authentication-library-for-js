/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { readFileSync } from "fs";
import path from "path";
import * as msalNode from "../../src/index.js";

describe("@azure/msal-node package contract", () => {
    test("exports the retained confidential client, managed identity, and cache runtime", () => {
        expect(msalNode).toEqual(
            expect.objectContaining({
                ConfidentialClientApplication: expect.any(Function),
                ManagedIdentityApplication: expect.any(Function),
                TokenCache: expect.any(Function),
                DistributedCachePlugin: expect.any(Function),
                CryptoProvider: expect.any(Function),
                PromptValue: expect.any(Object),
                ResponseMode: expect.any(Object),
            })
        );
    });

    test("does not export public client runtime", () => {
        expect(msalNode).not.toHaveProperty("PublicClientApplication");
    });

    test("declares an independent runtime dependency closure", () => {
        const packageJson = JSON.parse(
            readFileSync(path.resolve(__dirname, "../../package.json"), "utf8")
        );

        expect(packageJson.dependencies).toEqual({
            jsonwebtoken: "^9.0.0",
            "lru-cache": "^11.5.2",
        });
        expect(packageJson.dependencies).not.toHaveProperty(
            "@azure/msal-common"
        );
    });
});
