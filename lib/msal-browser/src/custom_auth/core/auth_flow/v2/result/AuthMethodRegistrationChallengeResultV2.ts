/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { AuthMethodVerificationRequiredStateV2 } from "../state/AuthMethodVerificationRequiredStateV2.js";

/**
 * The states a registration challenge action can resolve to. Successful
 * registration requires verification before the flow can complete.
 */
export type AuthMethodRegistrationChallengeResultStateV2 =
    | AuthMethodVerificationRequiredStateV2
    | FailedStateV2;

/**
 * Result of challenging a selected authentication method for registration.
 * It wraps the verification-required or failed state.
 */
export type AuthMethodRegistrationChallengeResultV2 =
    CustomAuthResultV2<AuthMethodRegistrationChallengeResultStateV2>;
