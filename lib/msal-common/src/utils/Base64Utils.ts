/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Calculates the decoded byte length of a base64url-encoded string.
 * Returns -1 when the string length cannot be valid base64url encoding.
 */
export function getBase64UrlDecodedLength(input: string): number {
    switch (input.length % 4) {
        case 0:
            return (input.length / 4) * 3;
        case 2:
            return Math.floor(input.length / 4) * 3 + 1;
        case 3:
            return Math.floor(input.length / 4) * 3 + 2;
        default:
            return -1;
    }
}
