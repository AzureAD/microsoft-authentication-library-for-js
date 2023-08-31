/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Class which exposes APIs to decode base64 strings to plaintext. See here for implementation details:
 * https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
 */

/**
 * Returns a URL-safe plaintext decoded string from b64 encoded input.
 * @param input
 */
export function base64Decode(input: string): string {
    return new TextDecoder().decode(base64DecToArr(input));
}

/**
 * Decodes base64 into Uint8Array
 * @param base64String
 */
function base64DecToArr(base64String: string): Uint8Array {
    const binString = atob(base64String);
    return Uint8Array.from(binString, (m) => m.codePointAt(0) || 0);
}
