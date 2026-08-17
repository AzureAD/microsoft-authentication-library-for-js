/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Digested return contracts of the reset-password steps on CustomAuthV2ApiClient - the per-step
 * values the controller layer needs to advance the SSPR flow (the carried continuation token plus
 * the next href). These are network-client DTOs, distinct from the public auth-flow results
 * exposed to the app. Only the reset-specific steps live here; the flow-agnostic
 * start/challenge/verify results live on V2BaseResults.
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
