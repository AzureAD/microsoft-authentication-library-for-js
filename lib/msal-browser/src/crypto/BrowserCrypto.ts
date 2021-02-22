/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { KEY_FORMAT_JWK, BROWSER_CRYPTO } from "../utils/BrowserConstants";
import { PopKeyOptions } from "./CryptoOps";

/**
 * This class implements functions used by the browser library to perform cryptography operations such as
 * hashing and encoding. It also has helper functions to validate the availability of specific APIs.
 */
export class BrowserCrypto {
    private utf8Encoder: TextEncoder;

    constructor() {
        if (!(this.hasCryptoAPI())) {
            throw BrowserAuthError.createCryptoNotAvailableError("Browser crypto or msCrypto object not available.");
        }

        this.utf8Encoder = new TextEncoder();
    }

    /**
     * Returns a sha-256 hash of the given dataString as an ArrayBuffer.
     * @param dataString 
     */
    async sha256Digest(dataString: string): Promise<ArrayBuffer> {
        const data = BrowserStringUtils.stringToUtf8Arr(dataString);

        return this.hasIECrypto() ? this.getMSCryptoDigest(BROWSER_CRYPTO.S256_HASH_ALG, data) : this.getSubtleCryptoDigest(BROWSER_CRYPTO.S256_HASH_ALG, data);
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
    async generateKeyPair(popKeyOptions: PopKeyOptions, extractable: boolean): Promise<CryptoKeyPair> {
        const keygenAlgorithmOptions = popKeyOptions;
        if (this.hasIECrypto()) {
            return this.msCryptoGenerateKey(popKeyOptions, extractable) as Promise<CryptoKeyPair>;
        } else {
            return window.crypto.subtle.generateKey(keygenAlgorithmOptions.popKeyGenAlgorithmOptions, extractable, keygenAlgorithmOptions.keyUsages) as Promise<CryptoKeyPair>;
        }
    }

    async decryptSessionKey(sessionKey: string, decryptionKey: CryptoKey) {
        console.log("DCSK: ", sessionKey);
        const buffer = BrowserStringUtils.stringToArrayBuffer(sessionKey);
        console.log("Buffer: ", buffer);
        return window.crypto.subtle.decrypt({name: "RSA-OAEP"}, decryptionKey, buffer);
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
    async importJwk(popKeyOptions: PopKeyOptions, key: JsonWebKey, extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKey> {
        const keyString = BrowserCrypto.getJwkString(key);
        const keyBuffer = BrowserStringUtils.stringToArrayBuffer(keyString);
        return this.hasIECrypto() ? 
            this.msCryptoImportKey(popKeyOptions, keyBuffer, extractable, usages) 
            : window.crypto.subtle.importKey(KEY_FORMAT_JWK, key, popKeyOptions.popKeyGenAlgorithmOptions, extractable, usages);
    }

    /**
     * Signs given data with given key
     * @param key 
     * @param data 
     */
    async sign(popKeyOptions: PopKeyOptions, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return this.hasIECrypto() ?
            this.msCryptoSign(popKeyOptions, key, data)
            : window.crypto.subtle.sign(popKeyOptions.popKeyGenAlgorithmOptions, key, data);
    }

    /**
     * Extracts session key from Session Key JWE using provided key
     */
    async unwrapSessionKey(sessionKeyJwe: string, key: CryptoKey): Promise<CryptoKey> {
        const parts = sessionKeyJwe.split(".");
        parts.forEach((part, index) => { console.log(index, ". ", part);});
        return key;
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
    private async msCryptoGenerateKey(popKeyOptions: PopKeyOptions, extractable: boolean): Promise<CryptoKeyPair> {
        return new Promise((resolve: any, reject: any) => {
            const msGenerateKey = window["msCrypto"].subtle.generateKey(popKeyOptions.popKeyGenAlgorithmOptions, extractable, popKeyOptions.keyUsages);
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
    private async msCryptoImportKey(popKeyOptions: PopKeyOptions, keyBuffer: ArrayBuffer, extractable: boolean, usages: Array<KeyUsage>): Promise<CryptoKey> {
        return new Promise((resolve: any, reject: any) => {
            const msImportKey = window["msCrypto"].subtle.importKey(KEY_FORMAT_JWK, keyBuffer, popKeyOptions.popKeyGenAlgorithmOptions, extractable, usages);
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
    private async msCryptoSign(popKeyOptions: PopKeyOptions, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
        return new Promise((resolve: any, reject: any) => {
            const msSign = window["msCrypto"].subtle.sign(popKeyOptions, key, data);
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
