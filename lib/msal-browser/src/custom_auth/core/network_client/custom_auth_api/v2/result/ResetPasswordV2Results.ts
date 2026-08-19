/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Reset-password response contracts used by the controller. Shared response
 * contracts are defined in `V2BaseResults`.
 */

// Result of submitting the new password: where to poll for completion.
export interface ResetPasswordUpdateResult {
    continuationToken: string;
    pollHref: string;
}

/*
 * Result of a single poll. `isCompleted` is true once the server reports `state: continue`, at
 * which point `continueHref` (the authorize-challenge resume endpoint) is present. While still in
 * progress the server returns a fresh `pollHref` (the poll endpoint may relocate between attempts);
 * the bounded poll loop that repeats this call lives in the controller layer, not in the api-client.
 */
export interface ResetPasswordPollResult {
    continuationToken: string;
    isCompleted: boolean;
    continueHref?: string;
    pollHref?: string;
}
