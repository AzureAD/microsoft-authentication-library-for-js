/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, PkceCodes } from "@azure/msal-common";

export class CryptoProvider implements ICrypto {

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }

    /**
     * Creates a new random GUID - used to populate state and nonce.
     */
    createNewGuid(): string {
        throw new Error("Method not implemented.");
    }

    /**
     * Encodes input string to base64.
     */
    base64Encode(): string {
        throw new Error("Method not implemented.");
    }

    /**
     * Decodes input string from base64.
     */
    base64Decode(): string {
        throw new Error("Method not implemented.");
    }

    /**
     * Generates PKCE codes used in Authorization Code Flow.
     */
    generatePkceCodes(): Promise<PkceCodes> {
        throw new Error("Method not implemented.");
    }

    /**
     * Generates a keypair, stores it and returns a thumbprint - not yet implemented for node
     */
    getPublicKeyThumbprint(): Promise<string> {
        throw new Error("Method not implemented.");
    }

    /**
     * Removes cryptographic keypair from key store matching the keyId passed in
     */
    removeTokenBindingKey(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    /**
     * Removes all cryptographic keys from Keystore
     */
    clearKeystore(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    /**
     * Signs the given object as a jwt payload with private key retrieved by given kid - currently not implemented for node
     */
    signJwt(): Promise<string> {
        throw new Error("Method not implemented.");
    }

    /**
     * Returns the SHA-256 hash of an input string
     */
    hashString(): Promise<string> {
        throw new Error("Method not implemented.");
    }
}
