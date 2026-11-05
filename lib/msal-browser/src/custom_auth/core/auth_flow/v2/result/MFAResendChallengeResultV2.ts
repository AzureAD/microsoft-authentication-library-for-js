/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { MFAVerificationRequiredStateV2 } from "../state/MFAVerificationRequiredStateV2.js";

/**
 * States returned after requesting a replacement MFA challenge.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type MFAResendChallengeResultStateV2 =
    | MFAVerificationRequiredStateV2
    | FailedStateV2;

/**
 * Result of requesting a replacement MFA challenge.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type MFAResendChallengeResultV2 =
    CustomAuthResultV2<MFAResendChallengeResultStateV2>;
