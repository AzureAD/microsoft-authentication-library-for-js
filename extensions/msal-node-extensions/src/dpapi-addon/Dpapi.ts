/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface DpapiBindings{
    protectData(dataToEncrypt: Uint8Array, optionalEntropy: Uint8Array, scope: string): Uint8Array
    unprotectData(encryptData: Uint8Array, optionalEntropy: Uint8Array, scope: string): Uint8Array
}
/* eslint-disable-next-line @typescript-eslint/no-var-requires, no-var */
export var Dpapi: DpapiBindings = require("bindings")("dpapi");
export default Dpapi;
