/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 * 
 */
import { BrowserStringUtils } from "../utils/BrowserStringUtils";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { StringUtils } from "@azure/msal-common";
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
 * Used for exporting keys
 */
export enum KeyFormat {
    jwk = "jwk"
}

/**
 * This class implements functions used by the browser library to perform cryptography operations such as
 * hashing and encoding. It also has helper functions to validate the availability of specific APIs.
 */
export class BrowserCrypto {

    private _keygenAlgorithmOptions: RsaHashedKeyGenParams;

    constructor(keygenAlgName?: string, hashAlg?: string, modLength?: number, publicExp?: Uint8Array) {
        if (!(this.hasCryptoAPI())) {
            throw BrowserAuthError.createCryptoNotAvailableError("Browser crypto or msCrypto object not available.");
        }

        const keygenConfigName: string = StringUtils.isEmpty(keygenAlgName) ? PKCS1_V15_KEYGEN_ALG : keygenAlgName;
        const keygenConfigHash: string = StringUtils.isEmpty(hashAlg) ? S256_HASH_ALG : hashAlg;
        const keygenConfigModulusLength: number = modLength ? modLength : MODULUS_LENGTH;
        const keygenConfigPublicExponent: Uint8Array = publicExp ? publicExp : PUBLIC_EXPONENT;

        this._keygenAlgorithmOptions = {
            name: keygenConfigName,
            hash: keygenConfigHash,
            modulusLength: keygenConfigModulusLength,
            publicExponent: keygenConfigPublicExponent
        };
        console.log(this._keygenAlgorithmOptions);
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
     * Export key as given KeyFormat (see above)
     * @param key 
     * @param format 
     */
    async exportKey(key: CryptoKey, format: KeyFormat): Promise<JsonWebKey> {
        return this.hasIECrypto() ? this.msCryptoExportKey(key, format) : window.crypto.subtle.exportKey(format, key);
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
        return !!window["msCrypto"];
    }

    /**
     * Check whether browser crypto is available.
     */
    private hasBrowserCrypto(): boolean {
        return !!window.crypto;
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
     * IE Helper function for exporting keys
     * @param key 
     * @param format 
     */
    private async msCryptoExportKey(key: CryptoKey, format: KeyFormat): Promise<JsonWebKey> {
        return new Promise((resolve: any, reject: any) => {
            const msExportKey = window["msCrypto"].subtle.exportKey(format, key);
            msExportKey.addEventListener("complete", (e: { target: { result: ArrayBuffer; }; }) => {
                // TODO: Check with Jason for details?
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
     * Returns stringified jwk.
     * @param jwk 
     */
    static getJwkString(jwk: JsonWebKey): string {
        return JSON.stringify(jwk, Object.keys(jwk).sort());
    }
}
