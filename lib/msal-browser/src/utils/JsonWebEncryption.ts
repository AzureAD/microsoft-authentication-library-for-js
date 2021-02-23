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
    public encryptedKey: Uint8Array;
    public initializationVector: Uint8Array;
    public ciphertext: Uint8Array;
    public authenticationTag: Uint8Array;

    constructor(rawJwe: string) {
        this.base64Decode = new Base64Decode();
        const jweAttributes = rawJwe.split(".");

        this.header = this.parseJweProtectedHeader(jweAttributes[0]);
        this.encryptedKey = this.base64Decode.base64DecToArr(jweAttributes[1]);
        this.initializationVector = this.base64Decode.base64DecToArr(jweAttributes[2]);
        this.ciphertext = this.base64Decode.base64DecToArr(jweAttributes[3]);
        this.authenticationTag = this.base64Decode.base64DecToArr(jweAttributes[4]);
        this.encryptedKey;
    }

    async unwrapContentEncryptionKey(unwrappingKey: any): Promise<CryptoKey> {
        const cek = await window.crypto.subtle.decrypt("RSA-OAEP", unwrappingKey, this.ciphertext);
        console.log(cek);
        return window.crypto.subtle.importKey("jwk", cek, "AES-GCM", false, ["decrypt"]);
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
