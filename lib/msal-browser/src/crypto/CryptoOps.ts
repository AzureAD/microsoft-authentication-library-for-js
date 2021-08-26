/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, ICrypto, CryptoKeyTypes, PkceCodes, SignedHttpRequest, ServerAuthorizationTokenResponse, BoundServerAuthorizationTokenResponse, CommonRefreshTokenRequest, BoundRefreshTokenRedemptionPayload } from "@azure/msal-common";
import { GuidGenerator } from "./GuidGenerator";
import { Base64Encode } from "../encode/Base64Encode";
import { Base64Decode } from "../encode/Base64Decode";
import { PkceGenerator } from "./PkceGenerator";
import { CtxGenerator } from "./CtxGenerator";
import { BrowserCrypto } from "./BrowserCrypto";
import { DatabaseStorage } from "../cache/DatabaseStorage";
import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { DBTableNames, MSAL_DB_NAME } from "../utils/BrowserConstants";
import { CryptoKeyFormats, CRYPTO_KEY_CONFIG } from "../utils/CryptoConstants";
import { BoundTokenResponse } from "./BoundTokenResponse";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BoundTokenRequest } from "./BoundTokenRequest";

export type CachedKeyPair = {
    publicKey: CryptoKey,
    privateKey: CryptoKey,
    requestMethod?: string,
    requestUri?: string
};

export type CryptoKeyOptions = {
    keyGenAlgorithmOptions: RsaHashedKeyGenParams,
    keypairUsages: KeyUsage[],
    privateKeyUsage: KeyUsage[]
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
    private ctxGenerator: CtxGenerator;

    private static EXTRACTABLE: boolean = true;

    private static DB_VERSION = 2;
    private static DB_NAME = MSAL_DB_NAME;
    private static TABLE_NAMES = [DBTableNames.asymmetricKeys, DBTableNames.symmetricKeys];
    private cache: DatabaseStorage;

    constructor() {
        // Browser crypto needs to be validated first before any other classes can be set.
        this.browserCrypto = new BrowserCrypto();
        this.b64Encode = new Base64Encode();
        this.b64Decode = new Base64Decode();
        this.guidGenerator = new GuidGenerator(this.browserCrypto);
        this.pkceGenerator = new PkceGenerator(this.browserCrypto);
        this.ctxGenerator = new CtxGenerator(this.browserCrypto);
        this.cache = new DatabaseStorage(CryptoOps.DB_NAME, CryptoOps.TABLE_NAMES, CryptoOps.DB_VERSION);
    }

    /**
     * Creates a new random GUID - used to populate state and nonce.
     * @returns string (GUID)
     */
    createNewGuid(): string {
        return this.guidGenerator.generateGuid();
    }

    /**
     * 
     * Creates a new random Ctx - used to derive Bound RT HMAC key.
     * @returns
     */
    createNewCtx(): Uint8Array {
        return this.ctxGenerator.generateCtx();
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
    async getPublicKeyThumbprint(request: BaseAuthRequest, keyType?: string): Promise<string> {
        let keyOptions: CryptoKeyOptions;
        
        switch(keyType) {
            case CryptoKeyTypes.stk_jwk:
                keyOptions = CRYPTO_KEY_CONFIG.RT_BINDING_STK_JWK;
                break;
            default:
                keyOptions = CRYPTO_KEY_CONFIG.AT_BINDING;
        }

        // Generate Keypair
        const keyPair = await this.browserCrypto.generateKeyPair(keyOptions, CryptoOps.EXTRACTABLE);

        // Generate Thumbprint for Public Key
        const publicKeyJwk: JsonWebKey = await this.browserCrypto.exportJwk(keyPair.publicKey);

        // Build JSON Web Key
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
        const unextractablePrivateKey: CryptoKey = await this.browserCrypto.importJwk(keyOptions, privateKeyJwk, false, keyOptions.privateKeyUsage);

        // Store Keypair data in keystore
        this.cache.put<CachedKeyPair>(
            DBTableNames.asymmetricKeys,
            publicJwkHash, 
            {
                privateKey: unextractablePrivateKey,
                publicKey: keyPair.publicKey,
                requestMethod: request.resourceRequestMethod,
                requestUri: request.resourceRequestUri
            }
        );

        return publicJwkHash;
    }

    /**
     * Removes cryptographic keypair from key store matching the keyId passed in
     * @param kid 
     */
    async removeTokenBindingKey(kid: string, keyType: CryptoKeyTypes): Promise<boolean> {
        // Remove asymmetric keypair
        let keysRemoved = await this.cache.delete(DBTableNames.asymmetricKeys, kid);

        if(keyType === CryptoKeyTypes.stk_jwk) {
            keysRemoved = keysRemoved && await this.cache.delete(DBTableNames.symmetricKeys, kid);
        }

        return keysRemoved;
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
        // Get keypair from cache
        const cachedKeyPair: CachedKeyPair = await this.cache.get<CachedKeyPair>(DBTableNames.asymmetricKeys, kid);
            
        if (!cachedKeyPair) {
            throw BrowserAuthError.createSigningKeyNotFoundInStorageError(kid);
        }

        // Get public key as JWK
        const publicKeyJwk = await this.browserCrypto.exportJwk(cachedKeyPair.publicKey);
        const publicKeyJwkString = BrowserCrypto.getJwkString(publicKeyJwk);

        // Generate header
        const header = {
            alg: publicKeyJwk.alg,
            type: CryptoKeyFormats.JWK
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
        const signatureBuffer = await this.browserCrypto.sign(CRYPTO_KEY_CONFIG.AT_BINDING, cachedKeyPair.privateKey, tokenBuffer);
        const encodedSignature = this.b64Encode.urlEncodeArr(new Uint8Array(signatureBuffer));

        return `${tokenString}.${encodedSignature}`;
    }

    /**
     * Returns the public key from an asymmetric key pair stored in IndexedDB based on the
     * public key thumbprint parameter
     * @param keyThumbprint 
     * @returns Public Key JWK string
     */
    async getAsymmetricPublicKey(keyThumbprint: string): Promise<string> {
        const cachedKeyPair: CachedKeyPair = await this.cache.get<CachedKeyPair>(DBTableNames.asymmetricKeys, keyThumbprint);
        // Get public key as JWK
        const publicKeyJwk = await this.browserCrypto.exportJwk(cachedKeyPair.publicKey);
        return BrowserCrypto.getJwkString(publicKeyJwk);
    }

    /**
     * Returns the decrypted server token response
     * @param boundServerTokenResponse 
     * @param request 
     */
    async decryptBoundTokenResponse(
        boundServerTokenResponse: BoundServerAuthorizationTokenResponse,
        request: BaseAuthRequest): Promise<ServerAuthorizationTokenResponse> {
        const boundResponse = new BoundTokenResponse(boundServerTokenResponse, request, this.cache);
        return await boundResponse.decrypt();
    }

    /**
     * Returns the signed token refresh request
     * @param request
     * @param payload
     */
    async signBoundTokenRequest(request: CommonRefreshTokenRequest, payload: BoundRefreshTokenRedemptionPayload): Promise<string> {
        const boundRequest = new BoundTokenRequest(request, payload, this.cache, this.browserCrypto);
        return await boundRequest.sign();
    }
}
