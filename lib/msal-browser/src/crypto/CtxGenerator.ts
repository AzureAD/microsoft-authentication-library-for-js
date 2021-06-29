/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserCrypto } from "./BrowserCrypto";
import { Base64Encode } from "../encode/Base64Encode";

export class CtxGenerator {

    // browser crypto object used to generate random values
    private cryptoObj: BrowserCrypto;
    private base64Encode: Base64Encode;

    constructor(cryptoObj: BrowserCrypto) {
        this.cryptoObj = cryptoObj;
        this.base64Encode = new Base64Encode();
    }

    generateCtx(): Uint8Array {
        const ctxBuffer = new Uint8Array(32);
        this.cryptoObj.getRandomValues(ctxBuffer);
        return ctxBuffer;
    }
}
