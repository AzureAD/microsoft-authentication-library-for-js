/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { Algorithms, CryptoKeyFormats } from "../utils/CryptoConstants";
import { Logger } from "..";

/**
 * See here for more info on RsaHashedKeyGenParams: https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams
 */
export type CryptoKeyOptions = {
    keyGenAlgorithmOptions: RsaHashedKeyGenParams,
    keypairUsages: KeyUsage[],
    privateKeyUsage: KeyUsage[]
};

/**
 * This class implements functions used by the browser library to perform cryptography operations such as
 * hashing and encoding. It also has helper functions to validate the availability of specific APIs.
 */
export class BrowserCrypto {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
        
        if (!(this.hasCryptoAPI())) {
            throw BrowserAuthError.createCryptoNotAvailableError("Browser crypto or msCrypto object not available.");
        }
    }

    /**
     * Returns a sha-256 hash of the given dataString as an ArrayBuffer.
     * @param dataString 
     */
    async sha256Digest(dataString: string): Promise<ArrayBuffer> {
        const data = BrowserStringUtils.stringToUtf8Arr(dataString);
        return this.hasIECrypto() ? this.getMSCryptoDigest(Algorithms.S256_HASH_ALG, data) : this.getSubtleCryptoDigest(Algorithms.S256_HASH_ALG, data);
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
    async generateKeyPair(keyOptions: CryptoKeyOptions, extractable: boolean): Promise<CryptoKeyPair> {
        const keyGenAlgorithmOptions = keyOptions.keyGenAlgorithmOptions;
        return (
            this.hasIECrypto() ? 
                this.msCryptoGenerateKey(keyOptions, extractable) 
                : window.crypto.subtle.generateKey(
                    keyGenAlgorithmOptions,
                    extractable,
                    keyOptions.keypairUsages
                )
        ) as Promise<CryptoKeyPair>;
    }

    /**
     * Export key as Json Web Key (JWK)
     * @param key 
     * @param format 
     */
    async exportJwk(key: CryptoKey): Promise<JsonWebKey> {
        return this.hasIECrypto() ? this.msCryptoExportJwk(key) : window.crypto.subtle.exportKey(CryptoKeyFormats.jwk, key);
    }

    /**
     * Imports key as Json Web Key (JWK), can set extractable and usages.
     * @param key 
     * @param format 
     * @param extractable 
     * @param usages 
     */
    async importJwk(keyOptions: CryptoKeyOptions, key: JsonWebKey, extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKey> {
        const keyString = BrowserCrypto.getJwkString(key);
        const keyBuffer = BrowserStringUtils.stringToArrayBuffer(keyString);

        return this.hasIECrypto() ? 
            this.msCryptoImportKey(keyOptions, keyBuffer, extractable, usages)
            : window.crypto.subtle.importKey(CryptoKeyFormats.jwk, key, keyOptions.keyGenAlgorithmOptions, extractable, usages);
    }

    /**
     * Signs given data with given key
     * @param key 
     * @param data 
     */
    async sign(keyOptions: CryptoKeyOptions, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return this.hasIECrypto() ?
            this.msCryptoSign(keyOptions, key, data)
            : window.crypto.subtle.sign(keyOptions.keyGenAlgorithmOptions, key, data);
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
    private async msCryptoGenerateKey(keyOptions: CryptoKeyOptions, extractable: boolean): Promise<CryptoKeyPair> {
        return new Promise((resolve: Function, reject: Function) => {
            const msGenerateKey = window["msCrypto"].subtle.generateKey(
                keyOptions.keyGenAlgorithmOptions,
                extractable,
                keyOptions.keypairUsages
            );
            
            msGenerateKey.addEventListener("complete", (e: { target: { result: CryptoKeyPair | PromiseLike<CryptoKeyPair>; }; }) => {
                resolve(e.target.result);
            });

            msGenerateKey.addEventListener("error", (error: string) => {
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
        return new Promise((resolve: Function, reject: Function) => {
            const msExportKey = window["msCrypto"].subtle.exportKey(CryptoKeyFormats.jwk, key);
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

            msExportKey.addEventListener("error", (error: string) => {
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
    private async msCryptoImportKey(keyOptions: CryptoKeyOptions, keyBuffer: ArrayBuffer, extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKey> {
        return new Promise((resolve: Function, reject: Function) => {
            const msImportKey = window["msCrypto"].subtle.importKey(CryptoKeyFormats.jwk, keyBuffer, keyOptions.keyGenAlgorithmOptions, extractable, usages);
            msImportKey.addEventListener("complete", (e: { target: { result: CryptoKey | PromiseLike<CryptoKey>; }; }) => {
                resolve(e.target.result);
            });

            msImportKey.addEventListener("error", (error: string) => {
                reject(error);
            });
        });
    }

    /**
     * IE Helper function for sign JWT
     * @param key 
     * @param data 
     */
    private async msCryptoSign(keyOptions: CryptoKeyOptions, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return new Promise((resolve: Function, reject: Function) => {
            const msSign = window["msCrypto"].subtle.sign(keyOptions, key, data);
            msSign.addEventListener("complete", (e: { target: { result: ArrayBuffer | PromiseLike<ArrayBuffer>; }; }) => {
                resolve(e.target.result);
            });

            msSign.addEventListener("error", (error: string) => {
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
