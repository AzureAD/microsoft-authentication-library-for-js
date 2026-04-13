/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as path from "path";
import * as os from "os";
import { createRequire } from "module";

/** Lazily resolved package root (parent of lib/ or dist/). Cached after first call. */
let _pkgRoot: string | undefined;

function getPkgRoot(): string {
    if (_pkgRoot) return _pkgRoot;
    const _req =
        typeof require !== "undefined" ? require : createRequire(import.meta.url);
    _pkgRoot = path.resolve(
        path.dirname(_req.resolve("./package.json")),
        ".."
    );
    return _pkgRoot;
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

    return path.join(getPkgRoot(), "bin", `win-${arch}`, "MsalMtlsMsiHelper.exe");
}
