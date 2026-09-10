/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { VerifyChallengeErrorV2 } from "../error/VerifyChallengeErrorV2.js";
import type { CompletedStateV2 } from "../state/CompletedStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";

/**
 * States returned after an app submits an MFA challenge. The operation either
 * completes sign-in or returns a failed state with error details.
 */
export type MFASubmitChallengeResultStateV2 = CompletedStateV2 | FailedStateV2;

/**
 * Result returned after an app submits an MFA challenge. Inspect the state to
 * determine whether sign-in completed or challenge verification failed.
 */
export type MFASubmitChallengeResultV2 = CustomAuthResultV2<
    MFASubmitChallengeResultStateV2,
    VerifyChallengeErrorV2,
    CustomAuthAccountData | undefined
>;
