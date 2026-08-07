/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Step 3 request challenge (send OTP) / resend.
export interface ChallengeV2Request {
    continuationToken: string;
}
