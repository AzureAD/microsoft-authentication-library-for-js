/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { MFAVerificationRequiredStateV2 } from "../state/MFAVerificationRequiredStateV2.js";

/**
 * States returned after an app requests a replacement MFA challenge. The
 * operation either returns refreshed verification metadata or a failed state.
 */
export type MFAResendChallengeResultStateV2 =
    | MFAVerificationRequiredStateV2
    | FailedStateV2;

/**
 * Result returned after an app requests a replacement MFA challenge. Inspect
 * the state before prompting the user for the new email or SMS challenge.
 */
export type MFAResendChallengeResultV2 = CustomAuthResultV2<
    MFAResendChallengeResultStateV2,
    RequestChallengeErrorV2
>;
