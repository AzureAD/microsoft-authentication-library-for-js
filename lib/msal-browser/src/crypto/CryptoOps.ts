/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, ICrypto, PkceCodes, SignedHttpRequest, ServerAuthorizationTokenResponse, BoundServerAuthorizationTokenResponse } from "@azure/msal-common";
import { GuidGenerator } from "./GuidGenerator";
import { Base64Encode } from "../encode/Base64Encode";
import { Base64Decode } from "../encode/Base64Decode";
import { PkceGenerator } from "./PkceGenerator";
import { BrowserCrypto } from "./BrowserCrypto";
import { DatabaseStorage } from "../cache/DatabaseStorage";
import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { CryptoKeyTypes, CryptoKeyFormats, CRYPTO_KEY_CONFIG, KEY_USAGES, CryptoLengths, KeyDerivationLabels, CryptoAlgorithms } from "../utils/CryptoConstants";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { JsonWebEncryption } from "./JsonWebEncryption";
import { KeyDerivation } from "./KeyDerivation";

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
    async getPublicKeyThumbprint(request: BaseAuthRequest, keyType?: string): Promise<string> {
        let keyOptions: CryptoKeyOptions;

        switch(keyType) {
            case CryptoKeyTypes.STK_JWK:
                keyOptions = CRYPTO_KEY_CONFIG.RT_BINDING;
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
        this.cache.put(publicJwkHash, {
            privateKey: unextractablePrivateKey,
            publicKey: keyPair.publicKey,
            requestMethod: request.resourceRequestMethod,
            requestUri: request.resourceRequestUri
        });

        return publicJwkHash;
    }

    /**
     * Signs the given object as a jwt payload with private key retrieved by given kid.
     * @param payload 
     * @param kid 
     */
    async signJwt(payload: SignedHttpRequest, kid: string): Promise<string> {
        // Get keypair from cache
        const cachedKeyPair: CachedKeyPair = await this.cache.get(kid);

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
        const cachedKeyPair: CachedKeyPair = await this.cache.get(keyThumbprint);
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
            
        const { session_key_jwe, response_jwe } = boundServerTokenResponse;

        if (session_key_jwe && response_jwe) {
            const kid = request.stkJwk;

            if (kid) {
                // Retrieve Session Transport KeyPair from Key Store
                const sessionTransportKeypair: CachedKeyPair = await this.cache.get(kid);
                // Deserialize session_key_jwe
                const sessionKeyJwe = new JsonWebEncryption(session_key_jwe);
                // Deserialize response_jwe
                const responseJwe = new JsonWebEncryption(response_jwe);

                const derivationKeyUsage = KEY_USAGES.RT_BINDING.DERIVATION_KEY;
                const contentEncryptionKey = await sessionKeyJwe.unwrap(sessionTransportKeypair.privateKey, derivationKeyUsage);

                // Derive the session key from the content encryption key
                const kdf = new KeyDerivation(
                    contentEncryptionKey,
                    CryptoLengths.DERIVED_KEY,
                    CryptoLengths.PRF_OUTPUT,
                    CryptoLengths.COUNTER
                );
                
                const derivedKeyData = await kdf.computeKDFInCounterMode(responseJwe.protectedHeader.ctx, KeyDerivationLabels.DECRYPTION);
                const sessionKeyUsages = KEY_USAGES.RT_BINDING.SESSION_KEY;
                const sessionKeyAlgorithm: AesKeyAlgorithm = { name: CryptoAlgorithms.AES_GCM, length: CryptoLengths.DERIVED_KEY };
                const sessionKey = await window.crypto.subtle.importKey(CryptoKeyFormats.RAW, derivedKeyData, sessionKeyAlgorithm, false, sessionKeyUsages);
                const responseStr = await responseJwe.decrypt(sessionKey);
                const response: ServerAuthorizationTokenResponse = JSON.parse(responseStr);
                return response;
            } else {
                throw BrowserAuthError.createMissingStkKidError();
            }
        } else {
            throw BrowserAuthError.createMissingStkKidError();
        }
    }
}
