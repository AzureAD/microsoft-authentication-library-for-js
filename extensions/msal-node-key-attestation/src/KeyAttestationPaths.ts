/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as path from "path";
import * as os from "os";
import { createRequire } from "module";

// Resolve __dirname for both CJS (test/jest) and ESM (runtime) contexts.
const _require =
    typeof require !== "undefined" ? require : createRequire(import.meta.url);
let _dirname: string;
try {
    _dirname = path.dirname(_require.resolve("./index.mjs"));
} catch {
    _dirname = path.dirname(_require.resolve("./index.js"));
}

/**
 * Returns the absolute path to the `MsalMtlsMsiHelper.exe` binary bundled
 * with this package (`bin/win-x64/MsalMtlsMsiHelper.exe`).
 *
 * This function is automatically called by the re-exported
 * `acquireMtlsMsiToken` and `makeMtlsMsiRequest` wrappers in this package.
 * It can also be called directly if you need to pass the path to the core
 * `@azure/msal-node-mtls-extensions` functions manually.
 *
 * @throws {Error} if the current platform is not Windows or the architecture
 * is not x64.
 */
export function getHelperPath(): string {
    if (os.platform() !== "win32") {
        throw new Error(
            "MsalMtlsMsiHelper.exe is only available for Windows. " +
                "Managed Identity mTLS PoP is only supported on Windows (VBS/KeyGuard)."
        );
    }

    const arch = os.arch();
    const supported = ["x64"];
    if (!supported.includes(arch)) {
        throw new Error(
            `Unsupported architecture "${arch}" for Managed Identity mTLS PoP. ` +
                `Only x64 is currently supported.`
        );
    }

    return path.join(_dirname, "..", "bin", `win-${arch}`, "MsalMtlsMsiHelper.exe");
}
