/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TokenClaims } from "./TokenClaims.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";

export const CBOR_TAG_CWT = 61;
export const CBOR_TAG_COSE_SIGN1 = 18;
export const COSE_ALG_ES256 = -7;
export const COSE_ALG_RS256 = -257;
export const COSE_HEADER_ALG = 1;
export const COSE_HEADER_CRIT = 2;
export const COSE_HEADER_KID = 4;
export const COSE_HEADER_TYP = 16;
export const COAP_CONTENT_FORMAT_CWT = 61;

const SUPPORTED_CRITICAL_COSE_HEADERS = new Set<number | string>([
    COSE_HEADER_ALG,
    COSE_HEADER_KID,
    COSE_HEADER_TYP,
]);

// Standard IANA CWT claims (RFC 8392, RFC 8747, RFC 9200)
export const CWT_CLAIM_ISS = 1;
export const CWT_CLAIM_SUB = 2;
export const CWT_CLAIM_AUD = 3;
export const CWT_CLAIM_EXP = 4;
export const CWT_CLAIM_NBF = 5;
export const CWT_CLAIM_IAT = 6;
export const CWT_CLAIM_CTI = 7;
export const CWT_CLAIM_CNF = 8;
export const CWT_CLAIM_SCOPE = 9;

// MSA Private-Use CWT claim keys (RFC 8392 Section 4: < -65536)
export const CWT_CLAIM_VER = -65537;
export const CWT_CLAIM_AZP = -65538;
export const CWT_CLAIM_AZPACR = -65539;
export const CWT_CLAIM_OID = -65540;
export const CWT_CLAIM_TID = -65541;
export const CWT_CLAIM_AIO = -65542;
export const CWT_CLAIM_NAME = -65543;
export const CWT_CLAIM_PREFERRED_USERNAME = -65544;
export const CWT_CLAIM_EMAIL = -65545;
export const CWT_CLAIM_ACR = -65546;
export const CWT_CLAIM_AUTH_TIME = -65547;
export const CWT_CLAIM_XMS_MFA_TIME = -65548;
export const CWT_CLAIM_XMS_CC = -65549;
export const CWT_CLAIM_EXT_MAP = -65550;
export const CWT_CLAIM_NONCE = -65551;
export const CWT_CLAIM_C_HASH = -65552;
export const CWT_CLAIM_AT_HASH = -65553;
export const CWT_CLAIM_SID = -65554;
export const CWT_CLAIM_SIGNIN_STATE = -65555;

const MAX_CBOR_BUFFER_BYTES = 32768;
const MAX_CBOR_DECODE_DEPTH = 8;
const BASE64URL_ALPHABET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const UTF8_DECODER = new TextDecoder("utf-8", {
    fatal: true,
    ignoreBOM: true,
});

export type CborTag = {
    tag: number;
    value: CborValue;
};

export type CborValue =
    | number
    | boolean
    | null
    | string
    | Uint8Array
    | CborValue[]
    | Map<number | string, CborValue>
    | CborTag;

export type CwtHeader = {
    alg: string;
    coseAlg: number;
    kid?: string;
    kidBytes?: Uint8Array;
    typ?: number | string;
};

export type DecodedCwtToken = {
    header: CwtHeader;
    claims: TokenClaims;
    protectedHeaderBytes: Uint8Array;
    payloadBytes: Uint8Array;
    signatureBytes: Uint8Array;
    rawByteLength: number;
    wireCharLength: number;
};

/**
 * Decode an unpadded or padded base64url string into raw bytes.
 */
export function base64UrlToBytes(input: string): Uint8Array {
    if (typeof input !== "string" || !input.length) {
        throw new Error("Empty base64url input");
    }
    const stripped = input.replace(/=+$/, "");
    if (!/^[A-Za-z0-9\-_]+$/.test(stripped)) {
        throw new Error("Invalid base64url character");
    }
    const outLen = Math.floor((stripped.length * 3) / 4);
    const out = new Uint8Array(outLen);
    let buffer = 0;
    let bits = 0;
    let outIndex = 0;

    for (let i = 0; i < stripped.length; i++) {
        const val = BASE64URL_ALPHABET.indexOf(stripped[i]);
        if (val < 0) {
            throw new Error("Invalid base64url character");
        }
        buffer = (buffer << 6) | val;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            if (outIndex < outLen) {
                out[outIndex++] = (buffer >> bits) & 0xff;
            }
        }
    }
    return out;
}

/**
 * Encode raw bytes to an unpadded base64url string.
 */
export function bytesToBase64Url(bytes: Uint8Array): string {
    let result = "";
    let i = 0;
    while (i < bytes.length) {
        const b0 = bytes[i++];
        const hasB1 = i < bytes.length;
        const b1 = hasB1 ? bytes[i++] : 0;
        const hasB2 = i < bytes.length;
        const b2 = hasB2 ? bytes[i++] : 0;

        result += BASE64URL_ALPHABET[(b0 >> 2) & 0x3f];
        result += BASE64URL_ALPHABET[((b0 & 0x03) << 4) | ((b1 >> 4) & 0x0f)];
        if (hasB1) {
            result +=
                BASE64URL_ALPHABET[((b1 & 0x0f) << 2) | ((b2 >> 6) & 0x03)];
        }
        if (hasB2) {
            result += BASE64URL_ALPHABET[b2 & 0x3f];
        }
    }
    return result;
}

/**
 * Format 16 network-byte-order (RFC 9562) bytes as a canonical lowercase UUID string.
 */
export function formatUuidBytes(bytes: Uint8Array): string {
    if (bytes.length !== 16) {
        throw new Error("UUID byte array must be 16 bytes");
    }
    const hex: string[] = [];
    for (let i = 0; i < 16; i++) {
        hex.push(bytes[i].toString(16).padStart(2, "0"));
    }
    return (
        `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-` +
        `${hex[4]}${hex[5]}-` +
        `${hex[6]}${hex[7]}-` +
        `${hex[8]}${hex[9]}-` +
        `${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`
    );
}

/**
 * Parse a canonical 36-character UUID string into 16 RFC 9562 big-endian bytes.
 */
export function parseUuidToBytes(uuid: string): Uint8Array {
    if (
        typeof uuid !== "string" ||
        !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            uuid
        )
    ) {
        throw new Error("Invalid UUID string");
    }
    const hex = uuid.replace(/-/g, "");
    const out = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
}

function encodeTypeAndArg(majorType: number, arg: number): Uint8Array {
    const prefix = (majorType & 0x07) << 5;
    if (arg < 24) {
        return new Uint8Array([prefix | arg]);
    }
    if (arg <= 0xff) {
        return new Uint8Array([prefix | 24, arg]);
    }
    if (arg <= 0xffff) {
        return new Uint8Array([prefix | 25, (arg >> 8) & 0xff, arg & 0xff]);
    }
    if (arg <= 0xffffffff) {
        return new Uint8Array([
            prefix | 26,
            (arg >>> 24) & 0xff,
            (arg >>> 16) & 0xff,
            (arg >>> 8) & 0xff,
            arg & 0xff,
        ]);
    }
    const hi = Math.floor(arg / 0x100000000);
    const lo = arg >>> 0;
    return new Uint8Array([
        prefix | 27,
        (hi >>> 24) & 0xff,
        (hi >>> 16) & 0xff,
        (hi >>> 8) & 0xff,
        hi & 0xff,
        (lo >>> 24) & 0xff,
        (lo >>> 16) & 0xff,
        (lo >>> 8) & 0xff,
        lo & 0xff,
    ]);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
    let total = 0;
    for (const chunk of chunks) {
        total += chunk.length;
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}

function compareLexicographic(a: Uint8Array, b: Uint8Array): number {
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
        if (a[i] !== b[i]) {
            return a[i] - b[i];
        }
    }
    return a.length - b.length;
}

/**
 * Encode a value using RFC 8949 Section 4.2.1 Core Deterministic CBOR encoding.
 */
export function encodeDeterministicCbor(value: CborValue): Uint8Array {
    if (typeof value === "number") {
        if (!Number.isInteger(value)) {
            throw new Error("Only integer CBOR numbers are supported");
        }
        if (value >= 0) {
            return encodeTypeAndArg(0, value);
        }
        return encodeTypeAndArg(1, -1 - value);
    }
    if (typeof value === "boolean") {
        return new Uint8Array([value ? 0xf5 : 0xf4]);
    }
    if (value === null) {
        return new Uint8Array([0xf6]);
    }
    if (value instanceof Uint8Array) {
        return concatBytes([encodeTypeAndArg(2, value.length), value]);
    }
    if (typeof value === "string") {
        const utf8 = new TextEncoder().encode(value);
        return concatBytes([encodeTypeAndArg(3, utf8.length), utf8]);
    }
    if (Array.isArray(value)) {
        const parts: Uint8Array[] = [encodeTypeAndArg(4, value.length)];
        for (const elem of value) {
            parts.push(encodeDeterministicCbor(elem));
        }
        return concatBytes(parts);
    }
    if (value instanceof Map) {
        const encodedPairs: Array<{ key: Uint8Array; val: Uint8Array }> = [];
        value.forEach((mapVal, mapKey) => {
            encodedPairs.push({
                key: encodeDeterministicCbor(mapKey),
                val: encodeDeterministicCbor(mapVal),
            });
        });
        encodedPairs.sort((lhs, rhs) => compareLexicographic(lhs.key, rhs.key));
        for (let i = 1; i < encodedPairs.length; i++) {
            if (
                compareLexicographic(
                    encodedPairs[i - 1].key,
                    encodedPairs[i].key
                ) === 0
            ) {
                throw new Error("Duplicate CBOR map key");
            }
        }
        const parts: Uint8Array[] = [encodeTypeAndArg(5, encodedPairs.length)];
        for (const pair of encodedPairs) {
            parts.push(pair.key, pair.val);
        }
        return concatBytes(parts);
    }
    if (typeof value === "object" && "tag" in value) {
        return concatBytes([
            encodeTypeAndArg(6, value.tag),
            encodeDeterministicCbor(value.value),
        ]);
    }
    throw new Error("Unsupported CBOR value");
}

function readCborItemInternal(
    bytes: Uint8Array,
    offset: number,
    depth: number
): { value: CborValue; nextOffset: number } {
    if (depth > MAX_CBOR_DECODE_DEPTH || offset >= bytes.length) {
        throw new Error("CBOR decode bounds or depth exceeded");
    }
    const initial = bytes[offset];
    const majorType = (initial >> 5) & 0x07;
    const addInfo = initial & 0x1f;
    let cursor = offset + 1;
    let arg = 0;

    if (addInfo < 24) {
        arg = addInfo;
    } else if (addInfo === 24) {
        if (cursor + 1 > bytes.length) {
            throw new Error("Truncated CBOR uint8");
        }
        arg = bytes[cursor++];
    } else if (addInfo === 25) {
        if (cursor + 2 > bytes.length) {
            throw new Error("Truncated CBOR uint16");
        }
        arg = (bytes[cursor] << 8) | bytes[cursor + 1];
        cursor += 2;
    } else if (addInfo === 26) {
        if (cursor + 4 > bytes.length) {
            throw new Error("Truncated CBOR uint32");
        }
        arg =
            ((bytes[cursor] << 24) >>> 0) +
            ((bytes[cursor + 1] << 16) |
                (bytes[cursor + 2] << 8) |
                bytes[cursor + 3]);
        cursor += 4;
    } else if (addInfo === 27) {
        if (cursor + 8 > bytes.length) {
            throw new Error("Truncated CBOR uint64");
        }
        const hi =
            ((bytes[cursor] << 24) >>> 0) +
            ((bytes[cursor + 1] << 16) |
                (bytes[cursor + 2] << 8) |
                bytes[cursor + 3]);
        const lo =
            ((bytes[cursor + 4] << 24) >>> 0) +
            ((bytes[cursor + 5] << 16) |
                (bytes[cursor + 6] << 8) |
                bytes[cursor + 7]);
        arg = hi * 0x100000000 + lo;
        if (!Number.isSafeInteger(arg)) {
            throw new Error("CBOR uint64 exceeds safe integer range");
        }
        cursor += 8;
    } else {
        throw new Error("Indefinite or reserved CBOR additional info");
    }

    switch (majorType) {
        case 0:
            return { value: arg, nextOffset: cursor };
        case 1: {
            const negVal = -1 - arg;
            if (!Number.isSafeInteger(negVal)) {
                throw new Error(
                    "CBOR negative integer exceeds safe integer range"
                );
            }
            return { value: negVal, nextOffset: cursor };
        }
        case 2: {
            if (cursor + arg > bytes.length) {
                throw new Error("Truncated CBOR byte string");
            }
            return {
                value: bytes.slice(cursor, cursor + arg),
                nextOffset: cursor + arg,
            };
        }
        case 3: {
            if (cursor + arg > bytes.length) {
                throw new Error("Truncated CBOR text string");
            }
            const text = UTF8_DECODER.decode(
                bytes.subarray(cursor, cursor + arg)
            );
            return { value: text, nextOffset: cursor + arg };
        }
        case 4: {
            if (arg > bytes.length - cursor) {
                throw new Error("Truncated CBOR array");
            }
            const arr: CborValue[] = [];
            for (let i = 0; i < arg; i++) {
                const elem = readCborItemInternal(bytes, cursor, depth + 1);
                arr.push(elem.value);
                cursor = elem.nextOffset;
            }
            return { value: arr, nextOffset: cursor };
        }
        case 5: {
            if (arg > Math.floor((bytes.length - cursor) / 2)) {
                throw new Error("Truncated CBOR map");
            }
            const map = new Map<number | string, CborValue>();
            for (let i = 0; i < arg; i++) {
                const k = readCborItemInternal(bytes, cursor, depth + 1);
                cursor = k.nextOffset;
                if (
                    typeof k.value !== "number" &&
                    typeof k.value !== "string"
                ) {
                    throw new Error("Unsupported CBOR map key type");
                }
                if (map.has(k.value)) {
                    throw new Error("Duplicate CBOR map key");
                }
                const v = readCborItemInternal(bytes, cursor, depth + 1);
                cursor = v.nextOffset;
                map.set(k.value, v.value);
            }
            return { value: map, nextOffset: cursor };
        }
        case 6: {
            const inner = readCborItemInternal(bytes, cursor, depth + 1);
            return {
                value: { tag: arg, value: inner.value },
                nextOffset: inner.nextOffset,
            };
        }
        case 7: {
            if (addInfo === 20) {
                return { value: false, nextOffset: cursor };
            }
            if (addInfo === 21) {
                return { value: true, nextOffset: cursor };
            }
            if (addInfo === 22) {
                return { value: null, nextOffset: cursor };
            }
            throw new Error("Unsupported CBOR simple value");
        }
        default:
            throw new Error("Invalid CBOR major type");
    }
}

/**
 * Decode a complete CBOR buffer into a CborValue.
 */
export function decodeCbor(bytes: Uint8Array): CborValue {
    if (
        !(bytes instanceof Uint8Array) ||
        bytes.length === 0 ||
        bytes.length > MAX_CBOR_BUFFER_BYTES
    ) {
        throw new Error("Invalid CBOR byte buffer");
    }
    const { value, nextOffset } = readCborItemInternal(bytes, 0, 0);
    if (nextOffset !== bytes.length) {
        throw new Error("Trailing bytes in CBOR buffer");
    }
    return value;
}

/**
 * Check whether an encoded OAuth/OIDC token string is a base64url-encoded CBOR Web Token (CWT).
 */
export function isCwtToken(encodedToken: string): boolean {
    if (
        typeof encodedToken !== "string" ||
        encodedToken.length < 6 ||
        encodedToken.includes(".")
    ) {
        return false;
    }
    try {
        const prefixChars = encodedToken.length >= 8 ? 8 : 4;
        const prefixBytes = base64UrlToBytes(
            encodedToken.slice(0, prefixChars)
        );
        if (prefixBytes.length < 3) {
            return false;
        }
        // Tagged CWT + COSE_Sign1: 0xd8 0x3d 0xd2 0x84 ("2D3S...")
        if (
            prefixBytes[0] === 0xd8 &&
            prefixBytes[1] === CBOR_TAG_CWT &&
            prefixBytes[2] === 0xd2
        ) {
            return true;
        }
        // COSE_Sign1 directly: 0xd2 0x84
        if (prefixBytes[0] === 0xd2 && prefixBytes[1] === 0x84) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

function coerceUuidOrString(val: CborValue): string | undefined {
    if (typeof val === "string") {
        return val;
    }
    if (val instanceof Uint8Array) {
        return val.length === 16 ? formatUuidBytes(val) : bytesToBase64Url(val);
    }
    return undefined;
}

function coerceOpaqueIdOrHash(val: CborValue): string | undefined {
    if (typeof val === "string") {
        return val;
    }
    if (val instanceof Uint8Array) {
        return bytesToBase64Url(val);
    }
    return undefined;
}

function parseStrictStringArray(val: CborValue): string[] | undefined {
    if (!Array.isArray(val)) {
        return undefined;
    }
    const out: string[] = [];
    for (const item of val) {
        if (typeof item !== "string") {
            return undefined;
        }
        out.push(item);
    }
    return out;
}

const DISALLOWED_OBJECT_KEYS = new Set<string>([
    "__proto__",
    "constructor",
    "prototype",
]);

const RESERVED_CWT_CLAIM_NAMES = new Set<string>([
    "iss",
    "sub",
    "aud",
    "exp",
    "nbf",
    "iat",
    "uti",
    "jti",
    "cnf",
    "scp",
    "ver",
    "azp",
    "azpacr",
    "oid",
    "tid",
    "aio",
    "name",
    "preferred_username",
    "email",
    "acr",
    "auth_time",
    "xms_mfa_time",
    "xms_cc",
    "nonce",
    "c_hash",
    "at_hash",
    "sid",
    "signin_state",
]);

const KNOWN_STRING_CLAIMS = new Set<string>([
    "tfp",
    "upn",
    "login_hint",
    "home_oid",
    "cloud_instance_host_name",
    "idp",
    "tenant_region_scope",
    "tenant_region_sub_scope",
    "at",
    "u",
    "p",
    "m",
]);

const KNOWN_STRING_ARRAY_CLAIMS = new Set<string>([
    "emails",
    "roles",
    "amr",
    "x5c_ca",
]);

function applyUnmappedStringClaim(
    claims: TokenClaims & Record<string, unknown>,
    seenClaims: Set<string>,
    key: string,
    val: CborValue
): void {
    if (DISALLOWED_OBJECT_KEYS.has(key)) {
        throw new Error("Disallowed CWT claim key");
    }
    if (seenClaims.has(key)) {
        throw new Error(`Duplicate normalized CWT claim: ${key}`);
    }
    if (KNOWN_STRING_CLAIMS.has(key)) {
        if (typeof val !== "string") {
            throw new Error(`Malformed CWT string claim: ${key}`);
        }
        seenClaims.add(key);
        claims[key] = val;
        return;
    }
    if (KNOWN_STRING_ARRAY_CLAIMS.has(key)) {
        const arr = parseStrictStringArray(val);
        if (!arr) {
            throw new Error(`Malformed CWT string-array claim: ${key}`);
        }
        seenClaims.add(key);
        claims[key] = arr;
        return;
    }
    if (key === "ts") {
        if (typeof val !== "number") {
            throw new Error("Malformed CWT numeric claim: ts");
        }
        seenClaims.add(key);
        claims.ts = val;
        return;
    }
    if (
        typeof val === "string" ||
        typeof val === "number" ||
        typeof val === "boolean"
    ) {
        seenClaims.add(key);
        claims[key] = val;
    } else if (Array.isArray(val)) {
        const arr = parseStrictStringArray(val);
        if (!arr) {
            throw new Error(`Malformed CWT array claim: ${key}`);
        }
        seenClaims.add(key);
        claims[key] = arr;
    }
}

function mapCwtClaimsToTokenClaims(
    cwtMap: Map<number | string, CborValue>
): TokenClaims {
    const claims: TokenClaims & Record<string, unknown> = {};
    const seenClaims = new Set<string>();

    const setClaimOnce = (prop: string, value: unknown): void => {
        if (seenClaims.has(prop)) {
            throw new Error(`Duplicate normalized CWT claim: ${prop}`);
        }
        seenClaims.add(prop);
        claims[prop] = value;
    };

    const requireString = (val: CborValue, prop: string): void => {
        if (typeof val !== "string") {
            throw new Error(`Malformed CWT string claim: ${prop}`);
        }
        setClaimOnce(prop, val);
    };

    const requireNumber = (val: CborValue, prop: string): void => {
        if (typeof val !== "number") {
            throw new Error(`Malformed CWT numeric claim: ${prop}`);
        }
        setClaimOnce(prop, val);
    };

    const requireUuidOrString = (val: CborValue, prop: string): void => {
        const parsed = coerceUuidOrString(val);
        if (parsed === undefined) {
            throw new Error(`Malformed CWT identifier claim: ${prop}`);
        }
        setClaimOnce(prop, parsed);
    };

    const requireOpaqueIdOrHash = (val: CborValue, prop: string): void => {
        const parsed = coerceOpaqueIdOrHash(val);
        if (parsed === undefined) {
            throw new Error(`Malformed CWT opaque claim: ${prop}`);
        }
        setClaimOnce(prop, parsed);
    };

    const requireStringArray = (val: CborValue, prop: string): void => {
        const parsed = parseStrictStringArray(val);
        if (!parsed) {
            throw new Error(`Malformed CWT string-array claim: ${prop}`);
        }
        setClaimOnce(prop, parsed);
    };

    cwtMap.forEach((val, key) => {
        if (key === CWT_CLAIM_ISS || key === "iss") {
            requireString(val, "iss");
        } else if (key === CWT_CLAIM_SUB || key === "sub") {
            requireString(val, "sub");
        } else if (key === CWT_CLAIM_AUD || key === "aud") {
            requireUuidOrString(val, "aud");
        } else if (key === CWT_CLAIM_EXP || key === "exp") {
            requireNumber(val, "exp");
        } else if (key === CWT_CLAIM_NBF || key === "nbf") {
            requireNumber(val, "nbf");
        } else if (key === CWT_CLAIM_IAT || key === "iat") {
            requireNumber(val, "iat");
        } else if (key === CWT_CLAIM_CTI || key === "uti" || key === "jti") {
            requireOpaqueIdOrHash(val, "uti");
        } else if (key === CWT_CLAIM_CNF || key === "cnf") {
            if (!(val instanceof Map)) {
                throw new Error("Malformed CWT cnf claim");
            }
            const kidVal =
                val.get(COSE_HEADER_KID) ?? val.get("kid") ?? val.get(3);
            const kidStr = coerceOpaqueIdOrHash(kidVal ?? null);
            if (!kidStr) {
                throw new Error("Malformed CWT cnf.kid claim");
            }
            setClaimOnce("cnf", { kid: kidStr });
        } else if (key === CWT_CLAIM_SCOPE || key === "scp") {
            requireString(val, "scp");
        } else if (key === CWT_CLAIM_VER || key === "ver") {
            requireString(val, "ver");
        } else if (key === CWT_CLAIM_AZP || key === "azp") {
            requireUuidOrString(val, "azp");
        } else if (key === CWT_CLAIM_AZPACR || key === "azpacr") {
            if (typeof val === "number") {
                setClaimOnce("azpacr", String(val));
            } else if (typeof val === "string") {
                setClaimOnce("azpacr", val);
            } else {
                throw new Error("Malformed CWT azpacr claim");
            }
        } else if (key === CWT_CLAIM_OID || key === "oid") {
            requireUuidOrString(val, "oid");
        } else if (key === CWT_CLAIM_TID || key === "tid") {
            requireUuidOrString(val, "tid");
        } else if (key === CWT_CLAIM_AIO || key === "aio") {
            if (val instanceof Uint8Array) {
                setClaimOnce("aio", bytesToBase64Url(val));
            } else if (typeof val === "string") {
                setClaimOnce("aio", val);
            } else {
                throw new Error("Malformed CWT aio claim");
            }
        } else if (key === CWT_CLAIM_NAME || key === "name") {
            requireString(val, "name");
        } else if (
            key === CWT_CLAIM_PREFERRED_USERNAME ||
            key === "preferred_username"
        ) {
            requireString(val, "preferred_username");
        } else if (key === CWT_CLAIM_EMAIL || key === "email") {
            requireString(val, "email");
        } else if (key === CWT_CLAIM_ACR || key === "acr") {
            requireString(val, "acr");
        } else if (key === CWT_CLAIM_AUTH_TIME || key === "auth_time") {
            requireNumber(val, "auth_time");
        } else if (key === CWT_CLAIM_XMS_MFA_TIME || key === "xms_mfa_time") {
            requireNumber(val, "xms_mfa_time");
        } else if (key === CWT_CLAIM_XMS_CC || key === "xms_cc") {
            requireStringArray(val, "xms_cc");
        } else if (key === CWT_CLAIM_NONCE || key === "nonce") {
            requireString(val, "nonce");
        } else if (key === CWT_CLAIM_C_HASH || key === "c_hash") {
            requireOpaqueIdOrHash(val, "c_hash");
        } else if (key === CWT_CLAIM_AT_HASH || key === "at_hash") {
            requireOpaqueIdOrHash(val, "at_hash");
        } else if (key === CWT_CLAIM_SID || key === "sid") {
            requireString(val, "sid");
        } else if (key === CWT_CLAIM_SIGNIN_STATE || key === "signin_state") {
            requireStringArray(val, "signin_state");
        } else if (key === CWT_CLAIM_EXT_MAP) {
            if (!(val instanceof Map)) {
                throw new Error("Malformed CWT extension claims map");
            }
            val.forEach((extVal, extKey) => {
                if (typeof extKey !== "string") {
                    throw new Error("CWT extension map keys must be strings");
                }
                if (RESERVED_CWT_CLAIM_NAMES.has(extKey)) {
                    throw new Error(
                        `Reserved CWT claim not permitted in extension map: ${extKey}`
                    );
                }
                applyUnmappedStringClaim(claims, seenClaims, extKey, extVal);
            });
        } else if (typeof key === "string") {
            applyUnmappedStringClaim(claims, seenClaims, key, val);
        }
    });

    return claims;
}

/**
 * Construct the deterministic RFC 9052 Section 4.4 Sig_structure byte array for COSE_Sign1.
 */
export function buildCoseSigStructure(
    protectedHeaderBytes: Uint8Array,
    payloadBytes: Uint8Array,
    externalAad: Uint8Array = new Uint8Array(0)
): Uint8Array {
    return encodeDeterministicCbor([
        "Signature1",
        protectedHeaderBytes,
        externalAad,
        payloadBytes,
    ]);
}

/**
 * Decode a base64url-encoded CBOR Web Token (CWT) wrapped in COSE_Sign1.
 */
export function decodeCwtToken(
    encodedToken: string,
    correlationId: string = ""
): DecodedCwtToken {
    if (!encodedToken) {
        throw createClientAuthError(
            ClientAuthErrorCodes.nullOrEmptyToken,
            correlationId
        );
    }

    try {
        const rawBytes = base64UrlToBytes(encodedToken);
        let root = decodeCbor(rawBytes);

        // Unwrap optional outer Tag 61 (CWT)
        if (
            root !== null &&
            typeof root === "object" &&
            "tag" in root &&
            root.tag === CBOR_TAG_CWT
        ) {
            root = root.value;
        }

        // Unwrap Tag 18 (COSE_Sign1)
        if (
            root === null ||
            typeof root !== "object" ||
            !("tag" in root) ||
            root.tag !== CBOR_TAG_COSE_SIGN1 ||
            !Array.isArray(root.value) ||
            root.value.length !== 4
        ) {
            throw new Error("Invalid COSE_Sign1 CWT envelope");
        }

        const [protVal, unprotVal, payloadVal, sigVal] = root.value;
        if (
            !(protVal instanceof Uint8Array) ||
            protVal.length === 0 ||
            !(unprotVal instanceof Map) ||
            !(payloadVal instanceof Uint8Array) ||
            payloadVal.length === 0 ||
            !(sigVal instanceof Uint8Array) ||
            sigVal.length === 0
        ) {
            throw new Error("Malformed COSE_Sign1 elements");
        }

        const protDecoded = decodeCbor(protVal);
        if (!(protDecoded instanceof Map)) {
            throw new Error("COSE protected header must be a CBOR map");
        }

        /*
         * RFC 9052 Section 3: reject duplicate header labels across protected and unprotected buckets,
         * and forbid security-sensitive alg/crit parameters in the unprotected bucket.
         */
        for (const label of protDecoded.keys()) {
            if (unprotVal.has(label)) {
                throw new Error(
                    "Duplicate COSE header parameter across protected and unprotected buckets"
                );
            }
        }
        if (unprotVal.has(COSE_HEADER_ALG) || unprotVal.has(COSE_HEADER_CRIT)) {
            throw new Error(
                "COSE alg and crit parameters are only permitted in protected header"
            );
        }

        // RFC 9052 Section 3.1: validate critical COSE header parameters (label 2).
        if (protDecoded.has(COSE_HEADER_CRIT)) {
            const critVal = protDecoded.get(COSE_HEADER_CRIT);
            if (!Array.isArray(critVal) || critVal.length === 0) {
                throw new Error("Malformed COSE crit header parameter");
            }
            for (const critLabel of critVal) {
                if (
                    (typeof critLabel !== "number" &&
                        typeof critLabel !== "string") ||
                    (typeof critLabel === "string" && critLabel.length === 0) ||
                    !protDecoded.has(critLabel) ||
                    !SUPPORTED_CRITICAL_COSE_HEADERS.has(critLabel)
                ) {
                    throw new Error(
                        "Unsupported or missing critical COSE header parameter"
                    );
                }
            }
        }

        const coseAlg = protDecoded.get(COSE_HEADER_ALG);
        if (typeof coseAlg !== "number") {
            throw new Error("Missing COSE alg in protected header");
        }
        const algName =
            coseAlg === COSE_ALG_ES256
                ? "ES256"
                : coseAlg === COSE_ALG_RS256
                ? "RS256"
                : `COSE(${coseAlg})`;

        const rawKid = protDecoded.has(COSE_HEADER_KID)
            ? protDecoded.get(COSE_HEADER_KID)
            : unprotVal.get(COSE_HEADER_KID);
        let kid: string | undefined;
        let kidBytes: Uint8Array | undefined;
        if (rawKid instanceof Uint8Array) {
            if (rawKid.length === 0) {
                throw new Error("Empty COSE kid header");
            }
            kidBytes = rawKid;
            kid = bytesToBase64Url(rawKid);
        } else if (typeof rawKid === "string") {
            if (rawKid.length === 0) {
                throw new Error("Empty COSE kid header");
            }
            kid = rawKid;
        } else if (rawKid !== undefined) {
            throw new Error("Malformed COSE kid header");
        }

        const rawTyp = protDecoded.has(COSE_HEADER_TYP)
            ? protDecoded.get(COSE_HEADER_TYP)
            : unprotVal.get(COSE_HEADER_TYP);
        const typ =
            typeof rawTyp === "number" || typeof rawTyp === "string"
                ? rawTyp
                : undefined;

        const payloadDecoded = decodeCbor(payloadVal);
        if (!(payloadDecoded instanceof Map)) {
            throw new Error("CWT payload must be a CBOR map");
        }

        return {
            header: {
                alg: algName,
                coseAlg,
                kid,
                kidBytes,
                typ,
            },
            claims: mapCwtClaimsToTokenClaims(payloadDecoded),
            protectedHeaderBytes: protVal,
            payloadBytes: payloadVal,
            signatureBytes: sigVal,
            rawByteLength: rawBytes.length,
            wireCharLength: encodedToken.length,
        };
    } catch {
        throw createClientAuthError(
            ClientAuthErrorCodes.tokenParsingError,
            correlationId
        );
    }
}

function isCompatibleEs256VerificationJwk(
    jwk: Record<string, unknown>,
    expectedKid?: string
): boolean {
    if (
        !jwk ||
        jwk.kty !== "EC" ||
        jwk.crv !== "P-256" ||
        typeof jwk.x !== "string" ||
        jwk.x.length === 0 ||
        typeof jwk.y !== "string" ||
        jwk.y.length === 0
    ) {
        return false;
    }
    if (jwk.use !== undefined && jwk.use !== "sig") {
        return false;
    }
    if (jwk.alg !== undefined && jwk.alg !== "ES256") {
        return false;
    }
    if (jwk.key_ops !== undefined) {
        if (!Array.isArray(jwk.key_ops) || !jwk.key_ops.includes("verify")) {
            return false;
        }
    }
    if (expectedKid && jwk.kid !== expectedKid) {
        return false;
    }
    return true;
}

/**
 * Cryptographically verify an ES256 COSE_Sign1 CWT against an OIDC JWKS key set using WebCrypto.
 */
export async function verifyCwtEs256Signature(
    encodedToken: string,
    jwks: { keys?: Array<Record<string, unknown>> },
    correlationId: string = ""
): Promise<DecodedCwtToken> {
    const decoded = decodeCwtToken(encodedToken, correlationId);
    if (
        decoded.header.coseAlg !== COSE_ALG_ES256 ||
        decoded.signatureBytes.length !== 64
    ) {
        throw createClientAuthError(
            ClientAuthErrorCodes.tokenParsingError,
            correlationId
        );
    }

    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
        throw new Error("WebCrypto subtle API is unavailable");
    }

    const keys = Array.isArray(jwks?.keys) ? jwks.keys : [];
    const candidateJwks = keys.filter((k) =>
        isCompatibleEs256VerificationJwk(k, decoded.header.kid)
    );
    if (candidateJwks.length === 0) {
        throw new Error(
            "No matching EC P-256 signing key found in JWKS for CWT verification"
        );
    }

    const sigStructure = buildCoseSigStructure(
        decoded.protectedHeaderBytes,
        decoded.payloadBytes
    );
    const sigBytes = new Uint8Array(decoded.signatureBytes);
    const sigData = new Uint8Array(sigStructure);

    for (const candidateJwk of candidateJwks) {
        const publicKey = await subtle.importKey(
            "jwk",
            {
                kty: "EC",
                crv: "P-256",
                x: candidateJwk.x as string,
                y: candidateJwk.y as string,
                ext: true,
            },
            { name: "ECDSA", namedCurve: "P-256" },
            false,
            ["verify"]
        );

        const verified = await subtle.verify(
            { name: "ECDSA", hash: "SHA-256" },
            publicKey,
            sigBytes,
            sigData
        );
        if (verified) {
            return decoded;
        }
    }

    throw createClientAuthError(
        ClientAuthErrorCodes.tokenParsingError,
        correlationId
    );
}
