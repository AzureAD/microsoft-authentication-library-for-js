/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Utility functions for managing date and time operations.
 */

/**
 * return the current time in Unix time (seconds).
 */
export function nowSeconds(): number {
    // Date.getTime() returns in milliseconds.
    return Math.round(new Date().getTime() / 1000.0);
}

/**
 * check if a token is expired based on given UTC time in seconds.
 * @param expiresOn
 */
export function isTokenExpired(expiresOn: string, offset: number): boolean {
    // check for access token expiry
    const expirationSec = Number(expiresOn) || 0;
    const offsetCurrentTimeSec = nowSeconds() + offset;

    // If current time + offset is greater than token expiration time, then token is expired.
    return offsetCurrentTimeSec > expirationSec;
}

/**
 * If the current time is earlier than the time that a token was cached at, we must discard the token
 * i.e. The system clock was turned back after acquiring the cached token
 * @param cachedAt
 * @param offset
 */
export function wasClockTurnedBack(cachedAt: string): boolean {
    const cachedAtSec = Number(cachedAt);

    return cachedAtSec > nowSeconds();
}

/**
 * Waits for t number of milliseconds
 * @param t number
 * @param value T
 */
export function delay<T>(t: number, value?: T): Promise<T | void> {
    return new Promise((resolve) => setTimeout(() => resolve(value), t));
}
