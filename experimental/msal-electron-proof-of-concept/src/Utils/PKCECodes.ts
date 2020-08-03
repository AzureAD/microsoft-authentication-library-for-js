// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * The PKCECodes type describes the structure
 * of objects that contain PKCE code
 * challenge and verifier pairs
 */
export type PKCECodes = {
    verifier: string,
    challenge: string
};
