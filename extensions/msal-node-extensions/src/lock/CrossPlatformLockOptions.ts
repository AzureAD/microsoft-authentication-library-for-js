/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Options for CrossPlatform lock.
 *
 * retryNumber: Numbers of times we should try to acquire a lock. Defaults to 500.
 * retryDelay: Time to wait before trying to retry a lock acquisition. Defaults to 100 ms.
 */
export type CrossPlatformLockOptions = {
    retryNumber: number;
    retryDelay: number;
};
