/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Utility class which exposes functions for managing date and time operations.
 */
export class TimeUtils {

    /**
     * return the current time in Unix time (seconds).
     */
    static nowSeconds(): number {
        // Date.getTime() returns in milliseconds.
        return Math.round(new Date().getTime() / 1000.0);
    }
    
    /**
     * check if a token is expired based on given UTC time in seconds.
     * @param expiresOn
     */
    static isTokenExpired(expiresOn: string, offset: number): boolean {
        // check for access token expiry
        const expirationSec = Number(expiresOn) || 0;
        const offsetCurrentTimeSec = TimeUtils.nowSeconds() + offset;

        // If current time + offset is greater than token expiration time, then token is expired.
        return (offsetCurrentTimeSec > expirationSec);
    }

    /**
     * If the current time is earlier than the time that a token was cached at, we must discard the token
     * i.e. The system clock was turned back after acquiring the cached token
     * @param cachedAt 
     * @param offset 
     */
    static wasClockTurnedBack(cachedAt: string): boolean {
        const cachedAtSec = Number(cachedAt);

        return cachedAtSec > TimeUtils.nowSeconds();
    }

    /**
     * Waits for t number of milliseconds
     * @param t number
     * @param value T
     */
    static delay<T>(t: number, value?: T): Promise<T | void> {
        return new Promise((resolve) => setTimeout(() => resolve(value), t));
    }
}
