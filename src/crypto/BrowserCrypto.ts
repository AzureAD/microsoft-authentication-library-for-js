/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { ISubtleCrypto } from "./ISubtleCrypto";
import { ModernBrowserCrypto } from "./ModernBrowserCrypto";
import { MsrBrowserCrypto } from "./MsrBrowserCrypto";
import { MsBrowserCrypto } from "./MsBrowserCrypto";
import { Logger } from "@azure/msal-common";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { CryptoOptions } from "../config/Configuration";
/**
 * See here for more info on RsaHashedKeyGenParams: https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams
 */
// RSA KeyGen Algorithm
const PKCS1_V15_KEYGEN_ALG = "RSASSA-PKCS1-v1_5";
// SHA-256 hashing algorithm
const S256_HASH_ALG = "SHA-256";
// MOD length for PoP tokens
const MODULUS_LENGTH = 2048;
// Public Exponent
const PUBLIC_EXPONENT: Uint8Array = new Uint8Array([0x01, 0x00, 0x01]);

/**
 * This class implements functions used by the browser library to perform cryptography operations such as
 * hashing and encoding. It also has helper functions to validate the availability of specific APIs.
 */
export class BrowserCrypto {

    private keygenAlgorithmOptions: RsaHashedKeyGenParams;
    private subtleCrypto: ISubtleCrypto;
    private logger: Logger;
    private cryptoOptions?: CryptoOptions;

    constructor(logger: Logger, cryptoOptions?: CryptoOptions) {
        this.logger = logger;
        this.cryptoOptions = cryptoOptions;

        if (this.hasBrowserCrypto()) {
            // Use standard modern web crypto if available
            this.logger.verbose("BrowserCrypto: modern crypto interface available");
            this.subtleCrypto = new ModernBrowserCrypto();
        } else if (this.hasIECrypto()) {
            // For IE11, use msCrypto interface
            this.logger.verbose("BrowserCrypto: MS crypto interface available");
            this.subtleCrypto = new MsBrowserCrypto();
        } else if (this.hasMsrCrypto() && this.cryptoOptions?.useMsrCrypto) {
            // For other browsers, use MSR Crypto if found
            this.logger.verbose("BrowserCrypto: MSR crypto interface available");
            this.subtleCrypto = new MsrBrowserCrypto();
        } else {
            if (this.hasMsrCrypto()) {
                this.logger.info("BrowserCrypto: MSR Crypto interface available but system.cryptoOptions.useMsrCrypto not enabled");
            }
            this.logger.error("BrowserCrypto: No crypto interfaces available.");
            throw BrowserAuthError.createCryptoNotAvailableError("Browser crypto, msCrypto, or msrCrypto interfaces not available.");
        }

        // Mainly needed for MSR Crypto: https://github.com/microsoft/MSR-JavaScript-Crypto#random-number-generator-prng
        if (this.subtleCrypto.initPrng) {
            this.logger.verbose("BrowserCrypto: Interface requires entropy");

            if (!this.cryptoOptions?.entropy) {
                this.logger.error("BrowserCrypto: Interface requires entropy but none provided.");
                throw BrowserConfigurationAuthError.createEntropyNotProvided();
            }

            this.logger.verbose("BrowserCrypto: Entropy provided");
            this.subtleCrypto.initPrng(this.cryptoOptions.entropy);
        }

        this.keygenAlgorithmOptions = {
            name: PKCS1_V15_KEYGEN_ALG,
            hash: S256_HASH_ALG,
            modulusLength: MODULUS_LENGTH,
            publicExponent: PUBLIC_EXPONENT
        };
    }

    /**
     * Check whether IE crypto or other browser cryptography is available.
     */
    private hasIECrypto(): boolean {
        return "msCrypto" in window;
    }

    /**
     * Check whether browser crypto is available.
     */
    private hasBrowserCrypto(): boolean {
        return "crypto" in window;
    }

    /**
     * Check whether MSR crypto polyfill is available
     */
    private hasMsrCrypto(): boolean {
        return "msrCrypto" in window;
    }

    /**
     * Returns a sha-256 hash of the given dataString as an ArrayBuffer.
     * @param dataString 
     */
    async sha256Digest(dataString: string): Promise<ArrayBuffer> {
        const data = BrowserStringUtils.stringToUtf8Arr(dataString);
        // MSR Crypto wants object with name property, instead of string
        return this.subtleCrypto.digest({ name: S256_HASH_ALG }, data);
    }

    /**
     * Populates buffer with cryptographically random values.
     * @param dataBuffer 
     */
    getRandomValues(dataBuffer: Uint8Array): Uint8Array {
        return this.subtleCrypto.getRandomValues(dataBuffer);
    }

    /**
     * Generates a keypair based on current keygen algorithm config.
     * @param extractable 
     * @param usages 
     */
    async generateKeyPair(extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKeyPair> {
        return this.subtleCrypto.generateKey(this.keygenAlgorithmOptions, extractable, usages);
    }

    /**
     * Export key as Json Web Key (JWK)
     * @param key 
     * @param format 
     */
    async exportJwk(key: CryptoKey): Promise<JsonWebKey> {
        return this.subtleCrypto.exportKey(key);
    }

    /**
     * Imports key as Json Web Key (JWK), can set extractable and usages.
     * @param key 
     * @param format 
     * @param extractable 
     * @param usages 
     */
    async importJwk(key: JsonWebKey, extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKey> {
        return this.subtleCrypto.importKey(key, this.keygenAlgorithmOptions, extractable, usages);
    }

    /**
     * Signs given data with given key
     * @param key 
     * @param data 
     */
    async sign(key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return this.subtleCrypto.sign(this.keygenAlgorithmOptions, key, data);
    }
}
