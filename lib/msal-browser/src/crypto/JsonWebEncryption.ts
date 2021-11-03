/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerAuthorizationTokenResponse, StringDict } from "@azure/msal-common";
import { JsonWebEncryptionError } from "../error/JsonWebEncryptionError";
import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { Algorithms, CryptoKeyFormats } from "../utils/CryptoConstants";

export type JoseHeader = {
    alg: string,
    enc: string,
    ctx: string,
    label: string
};

export type UnwrappingAlgorithmPair = {
    decryption: string,
    encryption: string
};

const KEY_ALGORITHM_MAP: StringDict = {
    "RSA-OAEP-256": Algorithms.RSA_OAEP,
    "A256GCM": Algorithms.AES_GCM,
    "dir": Algorithms.DIRECT
};

/**
 * This class deserializes a string in JWE Compact Serialization format into
 * it's decoded elements. The class also provides the validation, parsing and
 * decryption functionality for the resulting JWE.
 * 
 * See IETF RFC 7516 for the JsonWebEncryption Specification
 * https://tools.ietf.org/html/rfc7516
 */

export class JsonWebEncryption {
    private header: JoseHeader;
    private encryptedKey: string;
    private initializationVector: string;
    private ciphertext: string;
    private authenticationTag: string;
    private authenticatedData: Uint8Array;
    private unwrappingAlgorithms: UnwrappingAlgorithmPair;

    constructor(rawJwe: string) {
        const jweComponents = rawJwe.split(".");
        this.header = this.parseJweProtectedHeader(jweComponents[0]);
        this.authenticatedData = this.getAuthenticatedData(jweComponents[0]);
        this.unwrappingAlgorithms = this.setUnwrappingAlgorithms();
        this.encryptedKey = this.decodeElement(jweComponents[1]);
        this.initializationVector = this.decodeElement(jweComponents[2]);
        this.ciphertext = this.decodeElement(jweComponents[3]);
        this.authenticationTag = this.decodeElement(jweComponents[4]);
    }
    
    get protectedHeader(): JoseHeader {
        return this.header;
    }

    getAuthenticatedData(str: string): Uint8Array {
        const length = str.length;
        const data = new Uint8Array(length);

        /* mapping... */
        for (let charIndex = 0; charIndex < length; charIndex++) {
            data[charIndex] = str.charCodeAt(charIndex) & 255;
        }

        return data;
    }

    /**
     * Unwrapping a JWE encrypted key is done in two steps:
     *  1. Decrypt the base64Url decode encrypted key component using the algorithm
     *     specified in the "alg" attribute of the JWE header
     *  2. Import the result of previous step as a CryptoKey, setting the key algorithm to the one
     *     specified in the "enc" attribute of the JWE header
     * 
     * @param unwrappingKey - The private key from an asymmetric key pair in CryptoKey format
     * @param keyUsages - An array containing the usages for the imported key
     */
    async unwrap(unwrappingKey: CryptoKey, keyUsages: KeyUsage[]): Promise<CryptoKey> {
        const encryptedKeyBuffer = BrowserStringUtils.stringToArrayBuffer(this.encryptedKey);
        const contentEncryptionKey = await window.crypto.subtle.decrypt(this.unwrappingAlgorithms.decryption, unwrappingKey, encryptedKeyBuffer);
        return await window.crypto.subtle.importKey(
            CryptoKeyFormats.raw,
            contentEncryptionKey,
            {
                name: Algorithms.HMAC,
                hash: {
                    name: Algorithms.S256_HASH_ALG
                },
            },
            false,
            keyUsages);
    }

    /**
     * Returns decrypted response_jwe as a
     * bearer ServerAuthorizationServerTokenResponse
     * @param decryptionKey 
     * @returns 
     */
    async getDecryptedResponse(decryptionKey: CryptoKey): Promise<ServerAuthorizationTokenResponse> {
        const responseBuffer = await this.decrypt(decryptionKey);
        const responseBytes = new Uint8Array(responseBuffer);
        const responseString = BrowserStringUtils.utf8ArrToString(responseBytes);
        return JSON.parse(responseString);
    }

    /**
     * Encodes JWE segments into byte arrays and organizes them into
     * AES-GCM parameters
     * @param decryptionKey 
     * @returns 
     */
    private async decrypt(decryptionKey: CryptoKey): Promise<ArrayBuffer> {
        const ciphertextBytes = new Uint8Array(BrowserStringUtils.stringToArrayBuffer(this.ciphertext));
        const authenticationTagBytes = new Uint8Array(BrowserStringUtils.stringToArrayBuffer(this.authenticationTag));
        const encryptedData = this.concatenateEncryptedData(ciphertextBytes, authenticationTagBytes);
        const aesGcmParams = this.buildAesGcmParams(
            this.initializationVector,
            (authenticationTagBytes.length * 8),
            this.authenticatedData
        );
        return await window.crypto.subtle.decrypt(aesGcmParams, decryptionKey, encryptedData);
    }

    private buildAesGcmParams(initializationVector: string, tagLength: number, additionalData: Uint8Array): AesGcmParams {
        const iv = new Uint8Array(BrowserStringUtils.stringToArrayBuffer(initializationVector));

        return {
            name: CryptoAlgorithms.AES_GCM,
            iv: iv,
            additionalData: additionalData,
            tagLength: tagLength
        };
    }

    /**
     * Server AES-GCM encryption result splits the encrypted message
     * into ciphertext and authentication tag. This method concatenates these two byte arrays
     * to form the encrypted data input as expected by the SubtleCrypto.decrypt() API.
     * @param ciphertext 
     * @param authenticationTag 
     * @returns 
     */
    private concatenateEncryptedData(ciphertextBytes: Uint8Array, authenticationTagBytes: Uint8Array): Uint8Array {
        const encryptedData = new Uint8Array(ciphertextBytes.length + authenticationTagBytes.length);
        encryptedData.set(ciphertextBytes, 0);
        encryptedData.set(authenticationTagBytes, ciphertextBytes.byteLength);
        return encryptedData;
    }

    private parseJweProtectedHeader(encodedHeader: string): JoseHeader {
        const decodedHeader = this.decodeElement(encodedHeader);
        try {
            return JSON.parse(decodedHeader);
        } catch (error) {
            throw JsonWebEncryptionError.createJweHeaderNotParsedError();
        }
    }

    private setUnwrappingAlgorithms(): UnwrappingAlgorithmPair {
        return {
            decryption: this.matchKeyAlgorithm(this.header.alg),
            encryption: this.matchKeyAlgorithm(this.header.enc)
        };
    }

    private matchKeyAlgorithm(label: string): string {
        const matchedAlgorithm = KEY_ALGORITHM_MAP[label];

        if (matchedAlgorithm) {
            return matchedAlgorithm;
        } else {
            throw JsonWebEncryptionError.createHeaderAlgorithmMismatch(label);
        }
    }

    /**
     * Performs Base64URL decoding on a Base54URL encoded JWE fragment
     * @param encodedFragment 
     */
    private decodeElement(encodedFragment: string): string {
        const encodedString = encodedFragment.replace(/-/g, "+").replace(/_/g, "/");
        return atob(encodedString);
    }
}
