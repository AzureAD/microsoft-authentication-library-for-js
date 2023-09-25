/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PkceCodes } from "@azure/msal-common";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError";
import { urlEncodeArr } from "../encode/Base64Encode";
import { getRandomValues, sha256Digest } from "./BrowserCrypto";

// Constant byte array length
const RANDOM_BYTE_ARR_LENGTH = 32;

/**
 * This file defines APIs to generate PKCE codes and code verifiers.
 */

/**
 * Generates PKCE Codes. See the RFC for more information: https://tools.ietf.org/html/rfc7636
 */
export async function generatePkceCodes(): Promise<PkceCodes> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallengeFromVerifier(codeVerifier);
    return {
        verifier: codeVerifier,
        challenge: codeChallenge,
    };
}

/**
 * Generates a random 32 byte buffer and returns the base64
 * encoded string to be used as a PKCE Code Verifier
 */
function generateCodeVerifier(): string {
    try {
        // Generate random values as utf-8
        const buffer: Uint8Array = new Uint8Array(RANDOM_BYTE_ARR_LENGTH);
        getRandomValues(buffer);
        // encode verifier as base64
        const pkceCodeVerifierB64: string = urlEncodeArr(buffer);
        return pkceCodeVerifierB64;
    } catch (e) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.pkceNotCreated);
    }
}

/**
 * Creates a base64 encoded PKCE Code Challenge string from the
 * hash created from the PKCE Code Verifier supplied
 */
async function generateCodeChallengeFromVerifier(
    pkceCodeVerifier: string
): Promise<string> {
    try {
        // hashed verifier
        const pkceHashedCodeVerifier = await sha256Digest(pkceCodeVerifier);
        // encode hash as base64
        return urlEncodeArr(new Uint8Array(pkceHashedCodeVerifier));
    } catch (e) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.pkceNotCreated);
    }
}
