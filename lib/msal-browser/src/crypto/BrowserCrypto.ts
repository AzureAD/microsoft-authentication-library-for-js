/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError";
import {
    IPerformanceClient,
    Logger,
    PerformanceEvents,
} from "@azure/msal-common";
import { KEY_FORMAT_JWK } from "../utils/BrowserConstants";

/**
 * This file defines functions used by the browser library to perform cryptography operations such as
 * hashing and encoding. It also has helper functions to validate the availability of specific APIs.
 */

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
// UUID hex digits
const UUID_CHARS = "0123456789abcdef";
// Array to store UINT32 random value
const UINT32_ARR = new Uint32Array(1);

const keygenAlgorithmOptions: RsaHashedKeyGenParams = {
    name: PKCS1_V15_KEYGEN_ALG,
    hash: S256_HASH_ALG,
    modulusLength: MODULUS_LENGTH,
    publicExponent: PUBLIC_EXPONENT,
};

/**
 * Check whether browser crypto is available.
 */
export function validateCryptoAvailable(logger: Logger): void {
    if ("crypto" in window) {
        logger.verbose("BrowserCrypto: modern crypto interface available");
    } else {
        logger.error("BrowserCrypto: crypto interface is unavailable");
        throw createBrowserAuthError(BrowserAuthErrorCodes.cryptoNonExistent);
    }
}

/**
 * Returns a sha-256 hash of the given dataString as an ArrayBuffer.
 * @param dataString {string} data string
 * @param performanceClient {?IPerformanceClient}
 * @param correlationId {?string} correlation id
 */
export async function sha256Digest(
    dataString: string,
    performanceClient?: IPerformanceClient,
    correlationId?: string
): Promise<ArrayBuffer> {
    performanceClient?.addQueueMeasurement(
        PerformanceEvents.Sha256Digest,
        correlationId
    );
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    return window.crypto.subtle.digest(
        S256_HASH_ALG,
        data
    ) as Promise<ArrayBuffer>;
}

/**
 * Populates buffer with cryptographically random values.
 * @param dataBuffer
 */
export function getRandomValues(dataBuffer: Uint8Array): Uint8Array {
    return window.crypto.getRandomValues(dataBuffer);
}

/**
 * Returns random Uint32 value.
 * @returns {number}
 */
function getRandomUint32(): number {
    window.crypto.getRandomValues(UINT32_ARR);
    return UINT32_ARR[0];
}

/**
 * Creates a UUID v7 from the current timestamp.
 * Implementation relies on the system clock to guarantee increasing order of generated identifiers.
 * @returns {number}
 */
export function createNewGuid(): string {
    const currentTimestamp = Date.now();
    const baseRand = getRandomUint32() * 0x400 + (getRandomUint32() & 0x3ff);

    // Result byte array
    const bytes = new Uint8Array(16);
    // A 12-bit `rand_a` field value
    const randA = Math.trunc(baseRand / 2 ** 30);
    // The higher 30 bits of 62-bit `rand_b` field value
    const randBHi = baseRand & (2 ** 30 - 1);
    // The lower 32 bits of 62-bit `rand_b` field value
    const randBLo = getRandomUint32();

    bytes[0] = currentTimestamp / 2 ** 40;
    bytes[1] = currentTimestamp / 2 ** 32;
    bytes[2] = currentTimestamp / 2 ** 24;
    bytes[3] = currentTimestamp / 2 ** 16;
    bytes[4] = currentTimestamp / 2 ** 8;
    bytes[5] = currentTimestamp;
    bytes[6] = 0x70 | (randA >>> 8);
    bytes[7] = randA;
    bytes[8] = 0x80 | (randBHi >>> 24);
    bytes[9] = randBHi >>> 16;
    bytes[10] = randBHi >>> 8;
    bytes[11] = randBHi;
    bytes[12] = randBLo >>> 24;
    bytes[13] = randBLo >>> 16;
    bytes[14] = randBLo >>> 8;
    bytes[15] = randBLo;

    let text = "";
    for (let i = 0; i < bytes.length; i++) {
        text += UUID_CHARS.charAt(bytes[i] >>> 4);
        text += UUID_CHARS.charAt(bytes[i] & 0xf);
        if (i === 3 || i === 5 || i === 7 || i === 9) {
            text += "-";
        }
    }
    return text;
}

/**
 * Generates a keypair based on current keygen algorithm config.
 * @param extractable
 * @param usages
 */
export async function generateKeyPair(
    extractable: boolean,
    usages: Array<KeyUsage>
): Promise<CryptoKeyPair> {
    return window.crypto.subtle.generateKey(
        keygenAlgorithmOptions,
        extractable,
        usages
    ) as Promise<CryptoKeyPair>;
}

/**
 * Export key as Json Web Key (JWK)
 * @param key
 */
export async function exportJwk(key: CryptoKey): Promise<JsonWebKey> {
    return window.crypto.subtle.exportKey(
        KEY_FORMAT_JWK,
        key
    ) as Promise<JsonWebKey>;
}

/**
 * Imports key as Json Web Key (JWK), can set extractable and usages.
 * @param key
 * @param extractable
 * @param usages
 */
export async function importJwk(
    key: JsonWebKey,
    extractable: boolean,
    usages: Array<KeyUsage>
): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
        KEY_FORMAT_JWK,
        key,
        keygenAlgorithmOptions,
        extractable,
        usages
    ) as Promise<CryptoKey>;
}

/**
 * Signs given data with given key
 * @param key
 * @param data
 */
export async function sign(
    key: CryptoKey,
    data: ArrayBuffer
): Promise<ArrayBuffer> {
    return window.crypto.subtle.sign(
        keygenAlgorithmOptions,
        key,
        data
    ) as Promise<ArrayBuffer>;
}
