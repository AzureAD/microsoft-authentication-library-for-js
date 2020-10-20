/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, PkceCodes } from "@azure/msal-common";
import { GuidGenerator } from "./GuidGenerator";
import { EncodingUtils } from "../utils/EncodingUtils";
import { PkceGenerator } from "./PkceGenerator";

/**
 * This class implements MSAL node's crypto interface, which allows it to perform base64 encoding and decoding, generating cryptographically random GUIDs and
 * implementing Proof Key for Code Exchange specs for the OAuth Authorization Code Flow using PKCE (rfc here: https://tools.ietf.org/html/rfc7636).
 */
export class CryptoProvider implements ICrypto {
    private pkceGenerator: PkceGenerator;

    constructor() {
        // Browser crypto needs to be validated first before any other classes can be set.
        this.pkceGenerator = new PkceGenerator();
    }

    /**
     * Creates a new random GUID - used to populate state and nonce.
     * @returns string (GUID)
     */
    createNewGuid(): string {
        return GuidGenerator.generateGuid();
    }

    /**
     * Encodes input string to base64.
     * @param input
     */
    base64Encode(input: string): string {
        return EncodingUtils.base64Encode(input);
    }

    /**
     * Decodes input string from base64.
     * @param input
     */
    base64Decode(input: string): string {
        return EncodingUtils.base64Decode(input);
    }

    /**
     * Generates PKCE codes used in Authorization Code Flow.
     */
    generatePkceCodes(): Promise<PkceCodes> {
        return this.pkceGenerator.generatePkceCodes();
    }

    getPublicKeyThumbprint(): Promise<string> {
        throw new Error("Method not implemented.");
    }

    signJwt(): Promise<string> {
        throw new Error("Method not implemented.");
    }
}
