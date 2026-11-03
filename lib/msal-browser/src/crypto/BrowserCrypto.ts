/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { KEY_FORMAT_JWK } from "../utils/BrowserConstants.js";
import { base64Encode, urlEncodeArr } from "../encode/Base64Encode.js";
import { base64Decode, base64DecToArr } from "../encode/Base64Decode.js";

/**
 * This file defines functions used by the browser library to perform cryptography operations such as
 * hashing and encoding. It also has helper functions to validate the availability of specific APIs.
 */

/**
 * See here for more info on RsaHashedKeyGenParams: https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams
 */
// Algorithms
const PKCS1_V15_KEYGEN_ALG = "RSASSA-PKCS1-v1_5";
const AES_GCM = "AES-GCM";
const HKDF = "HKDF";
// SHA-256 hashing algorithm
const S256_HASH_ALG = "SHA-256";
// JWK values used by browser-internal WebCrypto helpers.
const JSON_WEB_KEY_CURVE_P256 = "P-256";
const ECDH_P384_ALGORITHM: EcKeyGenParams = {
    name: "ECDH",
    namedCurve: "P-384",
};
const JSON_WEB_KEY_TYPE_EC = "EC";
const JSON_WEB_KEY_TYPE_RSA = "RSA";
const MISSING_JWK_KTY_SUBERROR = "missing_jwk_kty";
const UNSUPPORTED_JWK_KTY_SUBERROR = "unsupported_jwk_kty";
const MISSING_JWK_MEMBER_SUBERROR = "missing_jwk_member";
const EMPTY_JWK_MEMBER_SUBERROR = "empty_jwk_member";
// MOD length for PoP tokens
const MODULUS_LENGTH = 2048;
// Public Exponent
const PUBLIC_EXPONENT: Uint8Array = new Uint8Array([0x01, 0x00, 0x01]);
// UUID hex digits
const UUID_CHARS = "0123456789abcdef";
// Array to store UINT32 random value
const UINT32_ARR = new Uint32Array(1);

// Key Format
const RAW = "raw";
// Key Usages
const ENCRYPT = "encrypt";
const DECRYPT = "decrypt";
const DERIVE_KEY = "deriveKey";

// Suberror
const SUBTLE_SUBERROR = "crypto_subtle_undefined";

export const RSA_KEYGEN_ALGORITHM_OPTIONS: RsaHashedKeyGenParams = {
    name: PKCS1_V15_KEYGEN_ALG,
    hash: S256_HASH_ALG,
    modulusLength: MODULUS_LENGTH,
    publicExponent: PUBLIC_EXPONENT,
};

export const RSA_SIGN_ALGORITHM_OPTIONS: Algorithm = {
    name: PKCS1_V15_KEYGEN_ALG,
};

export const ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS: EcKeyGenParams = {
    name: "ECDSA",
    namedCurve: JSON_WEB_KEY_CURVE_P256,
};

export const ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS: EcdsaParams = {
    name: "ECDSA",
    hash: { name: S256_HASH_ALG },
};

/**
 * Check whether browser crypto is available.
 */
export function validateCryptoAvailable(
    skipValidateSubtleCrypto: boolean
): void {
    if (!window) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.nonBrowserEnvironment,
            ""
        );
    }
    if (!window.crypto) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.cryptoNonExistent,
            ""
        );
    }
    if (!skipValidateSubtleCrypto && !window.crypto.subtle) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.cryptoNonExistent,
            "",
            SUBTLE_SUBERROR
        );
    }
}

/**
 * Returns a sha-256 hash of the given dataString as an ArrayBuffer.
 * @param dataString {string} data string
 * @param performanceClient {?IPerformanceClient}
 * @param correlationId {?string} correlation id
 */
export async function sha256Digest(dataString: string): Promise<ArrayBuffer> {
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
 * Generates a keypair based on the provided algorithm config.
 * @param extractable
 * @param usages
 * @param algorithm
 */
export async function generateKeyPair(
    extractable: boolean,
    usages: Array<KeyUsage>,
    algorithm: AlgorithmIdentifier
): Promise<CryptoKeyPair> {
    return window.crypto.subtle.generateKey(
        algorithm,
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
 * @param algorithm
 */
export async function importJwk(
    key: JsonWebKey,
    extractable: boolean,
    usages: Array<KeyUsage>,
    algorithm: AlgorithmIdentifier
): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
        KEY_FORMAT_JWK,
        key,
        algorithm,
        extractable,
        usages
    ) as Promise<CryptoKey>;
}

/**
 * Signs given data with given key.
 * @param key
 * @param data
 * @param algorithm
 */
export async function sign(
    key: CryptoKey,
    data: BufferSource,
    algorithm: AlgorithmIdentifier
): Promise<ArrayBuffer> {
    return window.crypto.subtle.sign(
        algorithm,
        key,
        data
    ) as Promise<ArrayBuffer>;
}

/**
 * Generates Base64 encoded jwk used in the Encrypted Authorize Response (EAR) flow
 */
export async function generateEarKey(): Promise<string> {
    const key = await generateBaseKey();
    const keyStr = urlEncodeArr(new Uint8Array(key));

    const jwk = {
        alg: "dir",
        kty: "oct",
        k: keyStr,
    };

    return base64Encode(JSON.stringify(jwk));
}

/**
 * Local asymmetric EAR key material, separate from serializable request metadata.
 * @internal
 */
export type AsymmetricEarKey = {
    privateJwk: JsonWebKey;
    publicJwk: JsonWebKey;
};

/**
 * Generates P-384 ECDH keys for request-scoped private sessionStorage and public wire metadata.
 * @internal
 */
export async function generateAsymmetricEarKey(): Promise<AsymmetricEarKey> {
    const keyPair = await generateKeyPair(
        true,
        ["deriveBits"],
        ECDH_P384_ALGORITHM
    );
    const publicJwk = await exportJwk(keyPair.publicKey);
    const privateJwk = await exportJwk(keyPair.privateKey);

    return {
        privateJwk,
        publicJwk,
    };
}

/**
 * Restores a private EAR key as non-exportable. The serialized sessionStorage copy remains exportable.
 * @internal
 */
export async function importAsymmetricEarKey(
    privateJwk: JsonWebKey
): Promise<CryptoKey> {
    if (
        privateJwk?.kty !== "EC" ||
        privateJwk.crv !== "P-384" ||
        !privateJwk.d
    ) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.asymmetricEarKeyError,
            "",
            "invalid_private_key"
        );
    }
    try {
        return await importJwk(
            privateJwk,
            false,
            ["deriveBits"],
            ECDH_P384_ALGORITHM
        );
    } catch {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.asymmetricEarKeyError,
            "",
            "private_key_import_failed"
        );
    }
}

/**
 * Encodes the EAR client party information with a fresh 192-bit nonce.
 * @internal
 */
export function generateAsymmetricEarApv(publicJwk: JsonWebKey): string {
    const point = new Uint8Array(
        concatEarBytes(
            new Uint8Array([4]),
            decodeEarBase64Url(publicJwk.x || ""),
            decodeEarBase64Url(publicJwk.y || "")
        )
    );
    if (point.length !== 97) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.asymmetricEarKeyError,
            "",
            "invalid_public_key_coordinates"
        );
    }
    const nonce = new Uint8Array(24);
    window.crypto.getRandomValues(nonce);
    return urlEncodeArr(
        new Uint8Array(
            concatEarBytes(
                lengthPrefixEarBytes(new TextEncoder().encode("EarClient")),
                lengthPrefixEarBytes(point),
                lengthPrefixEarBytes(nonce)
            )
        )
    );
}

/**
 * Authenticates and decrypts direct ECDH-ES/P-384/A256GCM using JOSE Concat KDF.
 * Party information is used byte-for-byte; the service need not echo the request APV.
 * @internal
 */
export async function decryptAsymmetricEarResponse(
    privateJwk: JsonWebKey,
    apv: string,
    earJwe: string
): Promise<string> {
    let stage = "invalid_jwe_format_or_header";
    try {
        const parts = earJwe.split(".");
        if (parts.length !== 5 || parts[1] !== "") {
            throw new Error();
        }
        const header = JSON.parse(
            new TextDecoder("utf-8", { fatal: true }).decode(
                decodeEarBase64Url(parts[0])
            )
        );
        if (
            header.alg !== "ECDH-ES" ||
            header.enc !== "A256GCM" ||
            header.crit !== undefined ||
            header.zip !== undefined ||
            header.epk?.kty !== "EC" ||
            header.epk.crv !== "P-384" ||
            header.epk.d !== undefined ||
            (header.apv !== undefined && header.apv !== apv)
        ) {
            throw new Error();
        }
        const x = decodeEarBase64Url(header.epk.x);
        const y = decodeEarBase64Url(header.epk.y);
        const apuBytes = decodeEarBase64Url(header.apu);
        const apvBytes = decodeEarBase64Url(apv);
        const iv = decodeEarBase64Url(parts[2]);
        const ciphertext = decodeEarBase64Url(parts[3]);
        const tag = decodeEarBase64Url(parts[4]);
        if (
            x.length !== 48 ||
            y.length !== 48 ||
            iv.length !== 12 ||
            tag.length !== 16
        ) {
            throw new Error();
        }

        stage = "content_encryption_key_derivation_failed";
        const privateKey = await importAsymmetricEarKey(privateJwk);
        const publicKey = await importJwk(
            { kty: "EC", crv: "P-384", x: header.epk.x, y: header.epk.y },
            false,
            [],
            ECDH_P384_ALGORITHM
        );
        const secret = new Uint8Array(
            await window.crypto.subtle.deriveBits(
                { name: "ECDH", public: publicKey },
                privateKey,
                384
            )
        );
        // RFC 7518 section 4.6.2: one SHA-256 round produces the 256-bit content key.
        const input = new Uint8Array(
            concatEarBytes(
                earUint32(1),
                secret,
                lengthPrefixEarBytes(new TextEncoder().encode("A256GCM")),
                lengthPrefixEarBytes(apuBytes),
                lengthPrefixEarBytes(apvBytes),
                earUint32(256)
            )
        );
        let derivedKey: ArrayBuffer;
        try {
            derivedKey = await window.crypto.subtle.digest(
                S256_HASH_ALG,
                input
            );
        } finally {
            secret.fill(0);
            input.fill(0);
        }
        let key: CryptoKey;
        try {
            key = await window.crypto.subtle.importKey(
                RAW,
                derivedKey,
                AES_GCM,
                false,
                [DECRYPT]
            );
        } finally {
            new Uint8Array(derivedKey).fill(0);
        }
        stage = "jwe_decryption_failed";
        const plaintext = await window.crypto.subtle.decrypt(
            {
                name: AES_GCM,
                iv,
                tagLength: 128,
                additionalData: new TextEncoder().encode(parts[0]),
            },
            key,
            concatEarBytes(ciphertext, tag)
        );
        return new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
    } catch {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.failedToDecryptEarResponse,
            "",
            stage
        );
    }
}

/** Decodes canonical, unpadded JOSE base64url without accepting other alphabets. */
function decodeEarBase64Url(value: string): Uint8Array {
    if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) {
        throw new Error();
    }
    const bytes = new Uint8Array(base64DecToArr(value));
    if (urlEncodeArr(bytes) !== value) {
        throw new Error();
    }
    return bytes;
}

function earUint32(value: number): Uint8Array {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value);
    return bytes;
}

function concatEarBytes(...parts: Uint8Array[]): ArrayBuffer {
    const bytes = new Uint8Array(
        parts.reduce((length, part) => length + part.length, 0)
    );
    let offset = 0;
    for (const part of parts) {
        bytes.set(part, offset);
        offset += part.length;
    }
    return bytes.buffer;
}

function lengthPrefixEarBytes(bytes: Uint8Array): Uint8Array {
    return new Uint8Array(concatEarBytes(earUint32(bytes.length), bytes));
}

/**
 * Parses earJwk for encryption key and returns CryptoKey object
 * @param earJwk
 * @returns
 */
export async function importEarKey(earJwk: string): Promise<CryptoKey> {
    const b64DecodedJwk = base64Decode(earJwk);
    const jwkJson = JSON.parse(b64DecodedJwk);
    const rawKey = jwkJson.k;
    const keyBuffer = base64DecToArr(rawKey);

    return window.crypto.subtle.importKey(RAW, keyBuffer, AES_GCM, false, [
        DECRYPT,
    ]);
}

/**
 * Decrypt ear_jwe response returned in the Encrypted Authorize Response (EAR) flow
 * @param earJwk
 * @param earJwe
 * @returns
 */
export async function decryptEarResponse(
    earJwk: string,
    earJwe: string
): Promise<string> {
    const earJweParts = earJwe.split(".");
    if (earJweParts.length !== 5) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.failedToDecryptEarResponse,
            "",
            "jwe_length"
        );
    }

    const key = await importEarKey(earJwk).catch(() => {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.failedToDecryptEarResponse,
            "",
            "import_key"
        );
    });

    try {
        const header = new TextEncoder().encode(earJweParts[0]);
        const iv = base64DecToArr(earJweParts[2]);
        const ciphertext = base64DecToArr(earJweParts[3]);
        const tag = base64DecToArr(earJweParts[4]);
        const tagLengthBits = tag.byteLength * 8;

        // Concat ciphertext and tag
        const encryptedData = new Uint8Array(ciphertext.length + tag.length);
        encryptedData.set(ciphertext);
        encryptedData.set(tag, ciphertext.length);

        const decryptedData = await window.crypto.subtle.decrypt(
            {
                name: AES_GCM,
                iv: iv,
                tagLength: tagLengthBits,
                additionalData: header,
            },
            key,
            encryptedData
        );

        return new TextDecoder().decode(decryptedData);
    } catch (e) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.failedToDecryptEarResponse,
            "",
            "decrypt"
        );
    }
}

/**
 * Generates symmetric base encryption key. This may be stored as all encryption/decryption keys will be derived from this one.
 */
export async function generateBaseKey(): Promise<ArrayBuffer> {
    const key = await window.crypto.subtle.generateKey(
        {
            name: AES_GCM,
            length: 256,
        },
        true,
        [ENCRYPT, DECRYPT]
    );
    return window.crypto.subtle.exportKey(RAW, key);
}

/**
 * Returns the raw key to be passed into the key derivation function
 * @param baseKey
 * @returns
 */
export async function generateHKDF(baseKey: ArrayBuffer): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(RAW, baseKey, HKDF, false, [
        DERIVE_KEY,
    ]);
}

/**
 * Given a base key and a nonce generates a derived key to be used in encryption and decryption.
 * Note: every time we encrypt a new key is derived
 * @param baseKey
 * @param nonce
 * @returns
 */
async function deriveKey(
    baseKey: CryptoKey,
    nonce: ArrayBuffer,
    context: string
): Promise<CryptoKey> {
    return window.crypto.subtle.deriveKey(
        {
            name: HKDF,
            salt: nonce,
            hash: S256_HASH_ALG,
            info: new TextEncoder().encode(context),
        },
        baseKey,
        { name: AES_GCM, length: 256 },
        false,
        [ENCRYPT, DECRYPT]
    );
}

/**
 * Encrypt the given data given a base key. Returns encrypted data and a nonce that must be provided during decryption
 * @param key
 * @param rawData
 */
export async function encrypt(
    baseKey: CryptoKey,
    rawData: string,
    context: string
): Promise<{ data: string; nonce: string }> {
    const encodedData = new TextEncoder().encode(rawData);
    // The nonce must never be reused with a given key.
    const nonce = window.crypto.getRandomValues(new Uint8Array(16));
    const derivedKey = await deriveKey(baseKey, nonce, context);
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: AES_GCM,
            iv: new Uint8Array(12), // New key is derived for every encrypt so we don't need a new nonce
        },
        derivedKey,
        encodedData
    );

    return {
        data: urlEncodeArr(new Uint8Array(encryptedData)),
        nonce: urlEncodeArr(nonce),
    };
}

/**
 * Decrypt data with the given key and nonce
 * @param key
 * @param nonce
 * @param encryptedData
 * @returns
 */
export async function decrypt(
    baseKey: CryptoKey,
    nonce: string,
    context: string,
    encryptedData: string
): Promise<string> {
    const encodedData = base64DecToArr(encryptedData);
    const derivedKey = await deriveKey(baseKey, base64DecToArr(nonce), context);
    const decryptedData = await window.crypto.subtle.decrypt(
        {
            name: AES_GCM,
            iv: new Uint8Array(12), // New key is derived for every encrypt so we don't need a new nonce
        },
        derivedKey,
        encodedData
    );

    return new TextDecoder().decode(decryptedData);
}

/**
 * Returns the SHA-256 hash of an input string
 * @param plainText
 */
export async function hashString(plainText: string): Promise<string> {
    const hashBuffer: ArrayBuffer = await sha256Digest(plainText);
    const hashBytes = new Uint8Array(hashBuffer);
    return urlEncodeArr(hashBytes);
}

const JWK_THUMBPRINT_REQUIRED_MEMBERS: Record<string, Array<string>> = {
    [JSON_WEB_KEY_TYPE_EC]: ["crv", "kty", "x", "y"],
    [JSON_WEB_KEY_TYPE_RSA]: ["e", "kty", "n"],
};

function getJwkThumbprintMembers(
    publicJwk: JsonWebKey,
    correlationId: string
): Record<string, string> {
    const kty = publicJwk.kty;
    if (typeof kty !== "string" || kty.length === 0) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.invalidPublicJwk,
            correlationId,
            MISSING_JWK_KTY_SUBERROR
        );
    }

    const requiredMembers = JWK_THUMBPRINT_REQUIRED_MEMBERS[kty];
    if (!requiredMembers) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.invalidPublicJwk,
            correlationId,
            UNSUPPORTED_JWK_KTY_SUBERROR
        );
    }

    return requiredMembers.reduce((thumbprintMembers, memberName) => {
        const memberValue = publicJwk[memberName as keyof JsonWebKey];
        if (typeof memberValue !== "string") {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.invalidPublicJwk,
                correlationId,
                MISSING_JWK_MEMBER_SUBERROR
            );
        }

        if (memberValue.length === 0) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.invalidPublicJwk,
                correlationId,
                EMPTY_JWK_MEMBER_SUBERROR
            );
        }

        thumbprintMembers[memberName] = memberValue;
        return thumbprintMembers;
    }, {} as Record<string, string>);
}

/**
 * Computes an RFC 7638 JWK thumbprint for a public key.
 * The required members for the JWK key type are serialised in lexicographic order
 * and the SHA-256 digest is returned as a base64url string.
 * @internal
 */
export async function computeJwkThumbprint(
    publicJwk: JsonWebKey,
    correlationId: string
): Promise<string> {
    const thumbprintMembers = getJwkThumbprintMembers(publicJwk, correlationId);
    // RFC 7638 §3.3: use only required members, sorted lexicographically
    const thumbprintJson = JSON.stringify(
        thumbprintMembers,
        Object.keys(thumbprintMembers).sort()
    );
    return hashString(thumbprintJson);
}
