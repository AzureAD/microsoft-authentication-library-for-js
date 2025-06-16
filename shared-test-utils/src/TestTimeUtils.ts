/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Returns current time in JS Date object (milliseconds) with offset in seconds
 * @param offset
 */
export function nowDateWithOffset(offsetSeconds: number): Date {
    return new Date(Date.now() + Number(offsetSeconds) * 1000);
}

export function calculateExpiresDate(expiresIn: number): Date {
    const totalExpiresInSeconds = Math.round(Date.now() / 1000 + expiresIn);
    return new Date(totalExpiresInSeconds * 1000);
}
