/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Step 2 start reset-password.
export interface ResetPasswordStartV2Request {
    username: string;
    continuationToken: string;
}
