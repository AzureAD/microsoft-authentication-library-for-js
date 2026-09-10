/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Reset-password response contracts used by the controller. Shared response
 * contracts are defined in `BaseResultsV2`.
 */

// Result of submitting the new password: where to poll for completion.
export interface ResetPasswordUpdateResultV2 {
    continuationToken: string;
    pollHref: string;
}

/*
 * Result of a single poll. `isCompleted` is true once the server reports
 * `state: continue`. While still in progress the server returns a fresh
 * `pollHref`; the bounded poll loop lives in the controller layer.
 */
export interface ResetPasswordPollResultV2 {
    continuationToken: string;
    isCompleted: boolean;
    pollHref?: string;
}
