/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * // This constant can also be computed with the following algorithm:
 *const base64abc = [],
 *	A = "A".charCodeAt(0),
 *	a = "a".charCodeAt(0),
 *	n = "0".charCodeAt(0);
 *for (let i = 0; i < 26; ++i) {
 *	base64abc.push(String.fromCharCode(A + i));
 *}
 *for (let i = 0; i < 26; ++i) {
 *	base64abc.push(String.fromCharCode(a + i));
 *}
 *for (let i = 0; i < 10; ++i) {
 *	base64abc.push(String.fromCharCode(n + i));
 *}
 *base64abc.push("+");
 *base64abc.push("/");
 */

const base64abc = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"
];

/*
 * // This constant can also be computed with the following algorithm:
 *const l = 256, base64codes = new Uint8Array(l);
 *for (let i = 0; i < l; ++i) {
 *	base64codes[i] = 255; // invalid character
 *}
 *base64abc.forEach((char, index) => {
 *	base64codes[char.charCodeAt(0)] = index;
 *});
 *base64codes["=".charCodeAt(0)] = 0; // ignored anyway, so we just need to prevent an error
 */
const base64codes = [
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255,
    255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255,
    255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
];

function getBase64Code(charCode: number) {
    if (charCode >= base64codes.length) {
        throw new Error("Unable to parse base64 string.");
    }
    const code = base64codes[charCode];
    if (code === 255) {
        throw new Error("Unable to parse base64 string.");
    }
    return code;
}

export function bytesToBase64(bytes: number[] | Uint8Array): string {
    let result = "", i;
    const l = bytes.length;
    for (i = 2; i < l; i += 3) {
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
        result += base64abc[bytes[i] & 0x3F];
    }
    if (i === l + 1) { // 1 octet yet to write
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[(bytes[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) { // 2 octets yet to write
        result += base64abc[bytes[i - 2] >> 2];
        result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
        result += base64abc[(bytes[i - 1] & 0x0F) << 2];
        result += "=";
    }
    return result;
}

export function base64ToBytes(str: string): Uint8Array {
    if (str.length % 4 !== 0) {
        throw new Error("Unable to parse base64 string.");
    }
    const index = str.indexOf("=");
    if (index !== -1 && index < str.length - 2) {
        throw new Error("Unable to parse base64 string.");
    }
    const missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0;
    const n = str.length;
    const result = new Uint8Array(3 * (n / 4));
    let buffer: number;
    for (let i = 0, j = 0; i < n; i += 4, j += 3) {
        buffer =
			getBase64Code(str.charCodeAt(i)) << 18 |
			getBase64Code(str.charCodeAt(i + 1)) << 12 |
			getBase64Code(str.charCodeAt(i + 2)) << 6 |
			getBase64Code(str.charCodeAt(i + 3));
        result[j] = buffer >> 16;
        result[j + 1] = (buffer >> 8) & 0xFF;
        result[j + 2] = buffer & 0xFF;
    }
    return result.subarray(0, result.length - missingOctets);
}

export function base64encode(str: string, encoder: { encode: (str: string) => Uint8Array | number[] } = new TextEncoder()): string {
    return bytesToBase64(encoder.encode(str));
}

export function base64decode(str: string, decoder: { decode: (bytes: Uint8Array) => string } = new TextDecoder()): string {
    return decoder.decode(base64ToBytes(str));
}

export function base64UrlDecode(str: string): string {
    let base64String = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (base64String.length % 4) {
        case 0:
            break;
        case 2:
            base64String += "==";
            break;
        case 3:
            base64String += "=";
            break;
        default:
            throw new Error("Invalid base64 string");
    }
    return base64decode(base64String);
}
