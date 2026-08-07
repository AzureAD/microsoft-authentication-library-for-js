/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Step 4 verify: submit a single credential to `/methods/{type}/{id}/verify`.
/*
 * The credential is a distinct top-level key per method type (never overloaded onto one field):
 * email OTP sends `otp`. This is modelled as a discriminated union so the compiler enforces
 * that exactly one credential is present. Password-based verify is a future extension point:
 * add a `VerifyPasswordV2Request` member (`password: string`) and include it in the union
 * without touching the OTP member.
 */
export interface VerifyV2RequestBase {
    continuationToken: string;
}

export interface VerifyOtpV2Request extends VerifyV2RequestBase {
    otp: string;
}

export type VerifyV2Request = VerifyOtpV2Request;
