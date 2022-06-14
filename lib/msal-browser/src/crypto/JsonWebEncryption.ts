/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "@azure/msal-common";
import { JsonWebEncryptionError } from "../error/JsonWebEncryptionError";
import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { Algorithms, CryptoKeyFormats } from "../utils/CryptoConstants";

/**
 * JOSE Header Parameter specification
 * https://datatracker.ietf.org/doc/html/rfc7516#section-4.1
 */
export type JoseHeader = {
    alg: string,
    enc: string,
    zip?: string,
    jku?: string,
    jwk?: string,
    kid?: string,
    x5u?: string,
    x5c?: string,
    x5t?: string,
    x5tS256?: string,
    typ?: string,
    cty?: string,
    crit?: string
};

export type UnwrappingAlgorithmPair = {
    decryption: string,
    encryption: string
};

const KeyAlgorithmMap: StringDict = {
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

    private getAuthenticatedData(str: string): Uint8Array {
        const length = str.length;
        const data = new Uint8Array(length);

        // Maps authenticaed data string into unicode byte array
        for (let charIndex = 0; charIndex < length; charIndex++) {
            /**
             * Decode character at index and truncate to the
             * last 8 bits (& 255) before assigning since
             * it's a Uint8 Array
             */
            data[charIndex] = str.charCodeAt(charIndex) & 255;
        }

        return data;
    }

    /**
     * Unwrapping a JWE encrypted key is done in two steps:
     *  1. Decrypt the base64Url encoded encrypted key component using the algorithm
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
        return await window.crypto.subtle.importKey(CryptoKeyFormats.raw, contentEncryptionKey, this.unwrappingAlgorithms.encryption , false, keyUsages);
    }

    /**
     * Decodes and parses the JOSE header out of the JWE
     * https://datatracker.ietf.org/doc/html/rfc7516#section-4
     * @param encodedHeader 
     */
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
        const matchedAlgorithm = KeyAlgorithmMap[label];

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
