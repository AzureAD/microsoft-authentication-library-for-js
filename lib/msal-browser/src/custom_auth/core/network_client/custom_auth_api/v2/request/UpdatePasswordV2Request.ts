/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Step 5 submit new password (PUT `/methods/password/{id}`). SSPR (recovery) only — this
 * update-then-poll cycle is part of the password-reset flow, not sign-in. `newPassword`
 * matches the server's HAL body key.
 */
export interface UpdatePasswordV2Request {
    newPassword: string;
    continuationToken: string;
}
