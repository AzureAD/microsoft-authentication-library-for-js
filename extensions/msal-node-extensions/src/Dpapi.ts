/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface DpapiBindings{
    protectData(dataToEncrypt: Uint8Array, optionalEntropy: Uint8Array|null, scope: string): Uint8Array
    unprotectData(encryptData: Uint8Array, optionalEntropy: Uint8Array|null, scope: string): Uint8Array
}

class defaultDpapi implements DpapiBindings{
    protectData(dataToEncrypt: Uint8Array, optionalEntropy: Uint8Array|null, scope: string): Uint8Array {
        throw new Error("Dpapi is not supported on this platform");
    }
    unprotectData(encryptData: Uint8Array, optionalEntropy: Uint8Array|null, scope: string): Uint8Array {
        throw new Error("Dpapi is not supported on this platform");
    }
}

let Dpapi: DpapiBindings;
if (process.platform !== "win32") {
    Dpapi = new defaultDpapi();
} else {
    Dpapi = require(`../bin/${process.arch}/dpapi`);
}

export { Dpapi };
