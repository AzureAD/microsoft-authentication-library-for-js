/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JoseHeader, JweHeader, StringDict } from "@azure/msal-common";
import { JsonWebEncryptionError } from "../error/JsonWebEncryptionError";
import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { Algorithms, CryptoKeyFormats } from "../utils/CryptoConstants";

export type UnwrappingAlgorithmPair = {
    decryption: string,
    encryption: string
};

export enum JweTypes {
    SessionKey = "session_key",
    Response = "response"
}

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
    private header: JweHeader;
    private encryptedKey: string;
    private initializationVector: string;
    private ciphertext: string;
    private authenticationTag: string;
    private unwrappingAlgorithms: UnwrappingAlgorithmPair;
    private type?: JweTypes;

    constructor(rawJwe: string, type?: JweTypes) {
        const jweComponents = rawJwe.split(".");
        this.header = this.parseJweProtectedHeader(jweComponents[0], type);
        this.unwrappingAlgorithms = this.setUnwrappingAlgorithms();
        this.encryptedKey = this.decodeElement(jweComponents[1]);
        this.initializationVector = this.decodeElement(jweComponents[2]);
        this.ciphertext = this.decodeElement(jweComponents[3]);
        this.authenticationTag = this.decodeElement(jweComponents[4]);
    }
    
    get protectedHeader(): JweHeader {
        return this.header;
    }

    /**
     * Decodes the authenticated data vector into a Uint8Array
     * @param encodedAuthenticatedData
     * @returns 
     */
    private getAuthenticatedData(encodedAuthenticatedData: string): Uint8Array {
        const length = encodedAuthenticatedData.length;
        const data = new Uint8Array(length);

        // Maps authenticaed data string into unicode byte array
        for (let charIndex = 0; charIndex < length; charIndex++) {
            /**
             * Decode character at index and truncate to the
             * last 8 bits (& 255) before assigning since
             * it's a Uint8 Array
             */
            data[charIndex] = encodedAuthenticatedData.charCodeAt(charIndex) & 255;
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
     * Decodes and parses the JOSE header out of the JWE
     * https://datatracker.ietf.org/doc/html/rfc7516#section-4
     * @param encodedHeader 
     */
    private parseJweProtectedHeader(encodedHeader: string, jweType?: JweTypes): JweHeader {
        const decodedHeader = this.decodeElement(encodedHeader);
        try {
            const jweHeaderOptions = JSON.parse(decodedHeader);
            switch (jweType) {
                case JweTypes.SessionKey:
                    return JoseHeader.getSessionKeyJweHeader(jweHeaderOptions);
                case JweTypes.Response:
                    return JoseHeader.getResponseJweHeader(jweHeaderOptions);
                default:
                    throw JsonWebEncryptionError.createUnsupportedJweTypeError(jweType || "undefined", Object.values(JweTypes));
            }
        } catch (error) {
            throw error;
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
