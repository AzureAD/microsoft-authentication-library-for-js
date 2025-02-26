/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { REFRESH_TIME_SECONDS } from "../../CustomAuthConstants.js";

/**
 * Return the current time in Unix time (seconds).
 */
export function nowSeconds(): number {
    // Date.getTime() returns in milliseconds.
    return Math.round(new Date().getTime() / 1000.0);
}

/**
 * Return AuthorityMetadata ExpiresAt property (seconds).
 */
export function generateAuthorityMetadataExpiresAt(): number {
    return nowSeconds() + REFRESH_TIME_SECONDS;
}
