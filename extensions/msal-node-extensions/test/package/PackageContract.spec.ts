/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { readFileSync } from "fs";
import path from "path";
import * as nodeExtensions from "../../src/index.js";

describe("@azure/msal-node-extensions package contract", () => {
    test("exports persistence and locking consumers without native broker runtime", () => {
        expect(nodeExtensions).toEqual(
            expect.objectContaining({
                PersistenceCachePlugin: expect.any(Function),
                FilePersistence: expect.any(Function),
                FilePersistenceWithDataProtection: expect.any(Function),
                DataProtectionScope: expect.any(Object),
                KeychainPersistence: expect.any(Function),
                LibSecretPersistence: expect.any(Function),
                PersistenceCreator: expect.any(Function),
                Environment: expect.any(Function),
            })
        );
        expect(nodeExtensions).not.toHaveProperty("NativeBrokerPlugin");
    });

    test("does not depend on msal-node-runtime", () => {
        const packageJson = JSON.parse(
            readFileSync(path.resolve(__dirname, "../../package.json"), "utf8")
        );

        expect(packageJson.dependencies).not.toHaveProperty(
            "@azure/msal-node-runtime"
        );
    });
});
