/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, ICrypto, PkceCodes, SignedHttpRequest } from "@azure/msal-common";
import { GuidGenerator } from "./GuidGenerator";
import { Base64Encode } from "../encode/Base64Encode";
import { Base64Decode } from "../encode/Base64Decode";
import { PkceGenerator } from "./PkceGenerator";
import { BrowserCrypto } from "./BrowserCrypto";
import { DatabaseStorage } from "../cache/DatabaseStorage";
import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { KEY_FORMAT_JWK } from "../utils/BrowserConstants";
import { BrowserAuthError } from "../error/BrowserAuthError";

export type CachedKeyPair = {
    publicKey: CryptoKey,
    privateKey: CryptoKey,
    requestMethod?: string,
    requestUri?: string
};

/**
 * This class implements MSAL's crypto interface, which allows it to perform base64 encoding and decoding, generating cryptographically random GUIDs and 
 * implementing Proof Key for Code Exchange specs for the OAuth Authorization Code Flow using PKCE (rfc here: https://tools.ietf.org/html/rfc7636).
 */
export class CryptoOps implements ICrypto {

    private browserCrypto: BrowserCrypto;
    private guidGenerator: GuidGenerator;
    private b64Encode: Base64Encode;
    private b64Decode: Base64Decode;
    private pkceGenerator: PkceGenerator;

    private static POP_KEY_USAGES: Array<KeyUsage> = ["sign", "verify"];
    private static EXTRACTABLE: boolean = true;

    private static DB_VERSION = 1;
    private static DB_NAME = "msal.db";
    private static TABLE_NAME =`${CryptoOps.DB_NAME}.keys`;
    private cache: DatabaseStorage<CachedKeyPair>;

    constructor() {
        // Browser crypto needs to be validated first before any other classes can be set.
        this.browserCrypto = new BrowserCrypto();
        this.b64Encode = new Base64Encode();
        this.b64Decode = new Base64Decode();
        this.guidGenerator = new GuidGenerator(this.browserCrypto);
        this.pkceGenerator = new PkceGenerator(this.browserCrypto);
        this.cache = new DatabaseStorage(CryptoOps.DB_NAME, CryptoOps.TABLE_NAME, CryptoOps.DB_VERSION);
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

    /**
     * Generates a keypair, stores it and returns a thumbprint
     * @param request
     */
    async getPublicKeyThumbprint(request: BaseAuthRequest): Promise<string> {
        // Generate Keypair
        const keyPair = await this.browserCrypto.generateKeyPair(CryptoOps.EXTRACTABLE, CryptoOps.POP_KEY_USAGES);

        // Generate Thumbprint for Public Key
        const publicKeyJwk: JsonWebKey = await this.browserCrypto.exportJwk(keyPair.publicKey);
        const pubKeyThumprintObj: JsonWebKey = {
            e: publicKeyJwk.e,
            kty: publicKeyJwk.kty,
            n: publicKeyJwk.n
        };
        const publicJwkString: string = BrowserCrypto.getJwkString(pubKeyThumprintObj);
        const publicJwkBuffer: ArrayBuffer = await this.browserCrypto.sha256Digest(publicJwkString);
        const publicJwkHash: string = this.b64Encode.urlEncodeArr(new Uint8Array(publicJwkBuffer));

        // Generate Thumbprint for Private Key
        const privateKeyJwk: JsonWebKey = await this.browserCrypto.exportJwk(keyPair.privateKey);
        // Re-import private key to make it unextractable
        const unextractablePrivateKey: CryptoKey = await this.browserCrypto.importJwk(privateKeyJwk, false, ["sign"]);

        // Store Keypair data in keystore
        await this.cache.put(publicJwkHash, {
            privateKey: unextractablePrivateKey,
            publicKey: keyPair.publicKey,
            requestMethod: request.resourceRequestMethod,
            requestUri: request.resourceRequestUri
        });

        return publicJwkHash;
    }

    /**
     * Removes cryptographic keypair from key store matching the keyId passed in
     * @param kid 
     */
    async removeTokenBindingKey(kid: string): Promise<boolean> {
        return this.cache.delete(kid);
    }

    /**
     * Removes all cryptographic keys from IndexedDB storage
     */
    async clearKeystore(): Promise<boolean> {
        return this.cache.clear();
    }

    /**
     * Signs the given object as a jwt payload with private key retrieved by given kid.
     * @param payload 
     * @param kid 
     */
    async signJwt(payload: SignedHttpRequest, kid: string): Promise<string> {
        const cachedKeyPair = await this.cache.get(kid);
            
        if (!cachedKeyPair) {
            throw BrowserAuthError.createSigningKeyNotFoundInStorageError(kid);
        }

        // Get public key as JWK
        const publicKeyJwk = await this.browserCrypto.exportJwk(cachedKeyPair.publicKey);
        const publicKeyJwkString = BrowserCrypto.getJwkString(publicKeyJwk);

        // Generate header
        const header = {
            alg: publicKeyJwk.alg,
            type: KEY_FORMAT_JWK
        };
        const encodedHeader = this.b64Encode.urlEncode(JSON.stringify(header));

        // Generate payload
        payload.cnf = {
            jwk: JSON.parse(publicKeyJwkString)
        };
        const encodedPayload = this.b64Encode.urlEncode(JSON.stringify(payload));

        // Form token string
        const tokenString = `${encodedHeader}.${encodedPayload}`;

        // Sign token
        const tokenBuffer = BrowserStringUtils.stringToArrayBuffer(tokenString);
        const signatureBuffer = await this.browserCrypto.sign(cachedKeyPair.privateKey, tokenBuffer);
        const encodedSignature = this.b64Encode.urlEncodeArr(new Uint8Array(signatureBuffer));

        return `${tokenString}.${encodedSignature}`;
    }
}
