/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// Common package imports
import { ICrypto, PkceCodes } from "@azure/msal-common";
// GUIDs
import { GuidGenerator } from "./GuidGenerator";
// Base64
import { Base64Encode } from "../encode/Base64Encode";
import { Base64Decode } from "../encode/Base64Decode";
// PKCE
import { PkceGenerator } from "./PkceGenerator";
// Browser crypto implementation
import { BrowserCrypto } from "./BrowserCrypto";

/**
 * This class implements MSAL's crypto interface, which allows it to perform base64 encoding and decoding, generating cryptographically random GUIDs and 
 * implementing Proof Key for Code Exchange specs for the OAuth Authorization Code Flow using PKCE (rfc here: https://tools.ietf.org/html/rfc7636).
 */
export class CryptoOps implements ICrypto {

    // Browser crypto object - either mscrypto or window.crypto
    private browserCrypto: BrowserCrypto;
    // GUID Generator class
    private guidGenerator: GuidGenerator;
    // Base64 Encode and Decode
    private b64Encode: Base64Encode;
    private b64Decode: Base64Decode;
    // PKCE Generator using SHA-256
    private pkceGenerator: PkceGenerator;

    constructor() {
        // Browser crypto needs to be validated first before any other classes can be set.
        this.browserCrypto = new BrowserCrypto();
        this.b64Encode = new Base64Encode();
        this.b64Decode = new Base64Decode();
        this.guidGenerator = new GuidGenerator(this.browserCrypto);
        this.pkceGenerator = new PkceGenerator(this.browserCrypto);
    }

    /**
     * Creates a new random GUID - used to populate state and nonce.
     * @returns string (GUID)
     */
    createNewGuid(): string {
        return this.guidGenerator.generateGuid();
    }

    /**
     * Encodes input string to base64.
     * @param input 
     */
    base64Encode(input: string): string {
        return this.b64Encode.encode(input);
    }    
    
    /**
     * Decodes input string from base64.
     * @param input 
     */
    base64Decode(input: string): string {
        return this.b64Decode.decode(input);
    }

    /**
     * Generates PKCE codes used in Authorization Code Flow.
     */
    async generatePkceCodes(): Promise<PkceCodes> {
        return this.pkceGenerator.generateCodes();
    }
}
