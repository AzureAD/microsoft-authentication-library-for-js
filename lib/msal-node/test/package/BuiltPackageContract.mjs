/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import * as esm from "@azure/msal-node";

const require = createRequire(import.meta.url);
const cjs = require("@azure/msal-node");
const retainedRuntimeExports = [
    "ConfidentialClientApplication",
    "ManagedIdentityApplication",
    "TokenCache",
    "DistributedCachePlugin",
    "CryptoProvider",
    "PromptValue",
    "ResponseMode",
];

for (const packageEntrypoint of [esm, cjs]) {
    for (const exportName of retainedRuntimeExports) {
        assert.notEqual(
            packageEntrypoint[exportName],
            undefined,
            `Missing retained export: ${exportName}`
        );
    }
    assert.equal(packageEntrypoint.PublicClientApplication, undefined);
}
