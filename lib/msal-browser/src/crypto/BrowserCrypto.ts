/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { KEY_FORMAT_JWK } from "../utils/BrowserConstants";
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

    private _keygenAlgorithmOptions: RsaHashedKeyGenParams;

    constructor() {
        if (!(this.hasCryptoAPI())) {
            throw BrowserAuthError.createCryptoNotAvailableError("Browser crypto or msCrypto object not available.");
        }

        this._keygenAlgorithmOptions = {
            name: PKCS1_V15_KEYGEN_ALG,
            hash: S256_HASH_ALG,
            modulusLength: MODULUS_LENGTH,
            publicExponent: PUBLIC_EXPONENT
        };
    }

    /**
     * Returns a sha-256 hash of the given dataString as an ArrayBuffer.
     * @param dataString 
     */
    async sha256Digest(dataString: string): Promise<ArrayBuffer> {
        const data = BrowserStringUtils.stringToUtf8Arr(dataString);

        return this.hasIECrypto() ? this.getMSCryptoDigest(S256_HASH_ALG, data) : this.getSubtleCryptoDigest(S256_HASH_ALG, data);
    }

    /**
     * Populates buffer with cryptographically random values.
     * @param dataBuffer 
     */
    getRandomValues(dataBuffer: Uint8Array): void {
        const cryptoObj = window["msCrypto"] || window.crypto;
        if (!cryptoObj.getRandomValues) {
            throw BrowserAuthError.createCryptoNotAvailableError("getRandomValues does not exist.");
        }
        cryptoObj.getRandomValues(dataBuffer);
    }

    /**
     * Generates a keypair based on current keygen algorithm config.
     * @param extractable 
     * @param usages 
     */
    async generateKeyPair(extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKeyPair> {
        return (
            this.hasIECrypto() ? 
                this.msCryptoGenerateKey(extractable, usages) 
                : window.crypto.subtle.generateKey(this._keygenAlgorithmOptions, extractable, usages)
        ) as Promise<CryptoKeyPair>;
    }

    /**
     * Export key as Json Web Key (JWK)
     * @param key 
     * @param format 
     */
    async exportJwk(key: CryptoKey): Promise<JsonWebKey> {
        return this.hasIECrypto() ? this.msCryptoExportJwk(key) : window.crypto.subtle.exportKey(KEY_FORMAT_JWK, key);
    }

    /**
     * Imports key as Json Web Key (JWK), can set extractable and usages.
     * @param key 
     * @param format 
     * @param extractable 
     * @param usages 
     */
    async importJwk(key: JsonWebKey, extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKey> {
        const keyString = BrowserCrypto.getJwkString(key);
        const keyBuffer = BrowserStringUtils.stringToArrayBuffer(keyString);

        return this.hasIECrypto() ? 
            this.msCryptoImportKey(keyBuffer, extractable, usages) 
            : window.crypto.subtle.importKey(KEY_FORMAT_JWK, key, this._keygenAlgorithmOptions, extractable, usages);
    }

    /**
     * Signs given data with given key
     * @param key 
     * @param data 
     */
    async sign(key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return this.hasIECrypto() ?
            this.msCryptoSign(key, data)
            : window.crypto.subtle.sign(this._keygenAlgorithmOptions, key, data);
    }

    /**
     * Check whether IE crypto or other browser cryptography is available.
     */
    private hasCryptoAPI(): boolean {
        return this.hasIECrypto() || this.hasBrowserCrypto();
    }

    /**
     * Checks whether IE crypto (AKA msCrypto) is available.
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
     * Helper function for SHA digest.
     * @param algorithm 
     * @param data 
     */
    private async getSubtleCryptoDigest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer> {
        return window.crypto.subtle.digest(algorithm, data);
    }

    /**
     * IE Helper function for SHA digest.
     * @param algorithm 
     * @param data 
     */
    private async getMSCryptoDigest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const digestOperation = window["msCrypto"].subtle.digest(algorithm, data.buffer);
            digestOperation.addEventListener("complete", (e: { target: { result: ArrayBuffer | PromiseLike<ArrayBuffer>; }; }) => {
                resolve(e.target.result);
            });
            digestOperation.addEventListener("error", (error: string) => {
                reject(error);
            });
        });
    }

    /**
     * IE Helper function for generating a keypair
     * @param extractable 
     * @param usages 
     */
    private async msCryptoGenerateKey(extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKeyPair> {
        return new Promise((resolve: any, reject: any) => {
            const msGenerateKey = window["msCrypto"].subtle.generateKey(this._keygenAlgorithmOptions, extractable, usages);
            msGenerateKey.addEventListener("complete", (e: { target: { result: CryptoKeyPair | PromiseLike<CryptoKeyPair>; }; }) => {
                resolve(e.target.result);
            });

            msGenerateKey.addEventListener("error", (error: any) => {
                reject(error);
            });
        });
    }

    /**
     * IE Helper function for exportKey
     * @param key 
     * @param format 
     */
    private async msCryptoExportJwk(key: CryptoKey): Promise<JsonWebKey> {
        return new Promise((resolve: any, reject: any) => {
            const msExportKey = window["msCrypto"].subtle.exportKey(KEY_FORMAT_JWK, key);
            msExportKey.addEventListener("complete", (e: { target: { result: ArrayBuffer; }; }) => {
                const resultBuffer: ArrayBuffer = e.target.result;

                const resultString = BrowserStringUtils.utf8ArrToString(new Uint8Array(resultBuffer))
                    .replace(/\r/g, "")
                    .replace(/\n/g, "")
                    .replace(/\t/g, "")
                    .split(" ").join("")
                    .replace("\u0000", "");

                try {
                    resolve(JSON.parse(resultString));
                } catch (e) {
                    reject(e);
                }
            });

            msExportKey.addEventListener("error", (error: any) => {
                reject(error);
            });
        });
    }

    /**
     * IE Helper function for importKey
     * @param key 
     * @param format 
     * @param extractable 
     * @param usages 
     */
    private async msCryptoImportKey(keyBuffer: ArrayBuffer, extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKey> {
        return new Promise((resolve: any, reject: any) => {
            const msImportKey = window["msCrypto"].subtle.importKey(KEY_FORMAT_JWK, keyBuffer, this._keygenAlgorithmOptions, extractable, usages);
            msImportKey.addEventListener("complete", (e: { target: { result: CryptoKey | PromiseLike<CryptoKey>; }; }) => {
                resolve(e.target.result);
            });

            msImportKey.addEventListener("error", (error: any) => {
                reject(error);
            });
        });
    }

    /**
     * IE Helper function for sign JWT
     * @param key 
     * @param data 
     */
    private async msCryptoSign(key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return new Promise((resolve: any, reject: any) => {
            const msSign = window["msCrypto"].subtle.sign(this._keygenAlgorithmOptions, key, data);
            msSign.addEventListener("complete", (e: { target: { result: ArrayBuffer | PromiseLike<ArrayBuffer>; }; }) => {
                resolve(e.target.result);
            });

            msSign.addEventListener("error", (error: any) => {
                reject(error);
            });
        });
    }

    /**
     * Returns stringified jwk.
     * @param jwk 
     */
    static getJwkString(jwk: JsonWebKey): string {
        return JSON.stringify(jwk, Object.keys(jwk).sort());
    }
}
