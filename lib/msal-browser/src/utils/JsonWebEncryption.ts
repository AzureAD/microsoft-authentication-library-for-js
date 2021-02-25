/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Base64Decode } from "../encode/Base64Decode";
import { BrowserStringUtils } from "./BrowserStringUtils";

export type JweHeader = {
    alg: string,
    enc: string
};

export class JsonWebEncryption {
    private base64Decode: Base64Decode;
    public header: JweHeader;
    public encryptedKey: string;
    public initializationVector: string;
    public ciphertext: string;
    public authenticationTag: string;

    constructor(rawJwe: string) {
        this.base64Decode = new Base64Decode();
        const jweAttributes = rawJwe.split(".");

        this.header = this.parseJweProtectedHeader(jweAttributes[0]);
        this.encryptedKey = jweAttributes[1];
        this.initializationVector = this.base64Decode.decode(jweAttributes[2]);
        this.ciphertext = this.base64Decode.decode(jweAttributes[3]);
        this.authenticationTag = this.base64Decode.decode(jweAttributes[4]);
        this.encryptedKey;
    }

    async unwrapContentEncryptionKey(unwrappingKey: CryptoKey): Promise<CryptoKey> {
        const key = BrowserStringUtils.stringToArrayBuffer(this.encryptedKey);
        debugger;
        const cek = window.crypto.subtle.decrypt("RSA-OAEP", unwrappingKey, key); 
        const sk = window.crypto.subtle.importKey("jwk", await cek, "AES-GCM", false, ["decrypt"]);
        return Promise.all([cek, sk]).then(result => {
            console.log(result);
            return sk;
        });
    }

    private parseJweProtectedHeader(encodedHeader: string): JweHeader {
        const decodedHeader = this.base64Decode.decode(encodedHeader);
        try {
            return JSON.parse(decodedHeader);
        } catch (error) {
            throw error;
        }
    }
}
