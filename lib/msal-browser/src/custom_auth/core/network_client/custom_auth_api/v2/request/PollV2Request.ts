/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Step 6 poll for completion (`/methods/password/{id}/pollUpdate`). SSPR (recovery) only.
 * Repeated until the reset finishes.
 */
export interface PollV2Request {
    continuationToken: string;
}
