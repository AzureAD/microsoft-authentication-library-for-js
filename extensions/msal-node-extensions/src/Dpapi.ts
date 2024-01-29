/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { createRequire } from "module";

export interface DpapiBindings {
    protectData(
        dataToEncrypt: Uint8Array,
        optionalEntropy: Uint8Array | null,
        scope: string
    ): Uint8Array;
    unprotectData(
        encryptData: Uint8Array,
        optionalEntropy: Uint8Array | null,
        scope: string
    ): Uint8Array;
}

class defaultDpapi implements DpapiBindings {
    protectData(): Uint8Array {
        throw new Error("Dpapi is not supported on this platform");
    }
    unprotectData(): Uint8Array {
        throw new Error("Dpapi is not supported on this platform");
    }
}

let Dpapi: DpapiBindings;
if (process.platform !== "win32") {
    Dpapi = new defaultDpapi();
} else {
    // In .mjs files, require is not defined. We need to use createRequire to get a require function
    const safeRequire =
        typeof require !== "undefined"
            ? require
            : createRequire(import.meta.url);

    Dpapi = safeRequire(`../bin/${process.arch}/dpapi`);
}

export { Dpapi };
