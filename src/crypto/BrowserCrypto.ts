/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { BrowserAuthError } from "../error/BrowserAuthError";

const HASH_ALG = "SHA-256";

export class BrowserCrypto {

    constructor() {
        if (!(this.hasCryptoAPI())) {
            throw BrowserAuthError.createCryptoNotAvailableError("Browser crypto or msCrypto object not available.");
        }
    }

    async sha256Digest(dataString: string): Promise<ArrayBuffer> {
        const data = BrowserStringUtils.stringToUtf8Arr(dataString);

        if (this.hasIECrypto()) {
            return new Promise((resolve, reject) => {
                const digestOperation = window["msCrypto"].subtle.digest(HASH_ALG, data.buffer);
                digestOperation.addEventListener("complete", (e: { target: { result: ArrayBuffer | PromiseLike<ArrayBuffer>; }; }) => {
                    resolve(e.target.result);
                });
                digestOperation.addEventListener("error", (error: any) => {
                    reject(error);
                });
            });
        }

        return window.crypto.subtle.digest(HASH_ALG, data);
    }

    getRandomValues(dataBuffer: Uint8Array): void {
        const cryptoObj = window["msCrypto"] || window.crypto;
        if (!cryptoObj.getRandomValues) {
            throw BrowserAuthError.createCryptoNotAvailableError("getRandomValues does not exist.");
        }
        cryptoObj.getRandomValues(dataBuffer);
    }

    private hasIECrypto(): boolean {
        return !!window["msCrypto"];
    }

    private hasBrowserCrypto(): boolean {
        return !!window.crypto;
    }

    private hasCryptoAPI(): boolean {
        return this.hasIECrypto() || this.hasBrowserCrypto();
    }
}
