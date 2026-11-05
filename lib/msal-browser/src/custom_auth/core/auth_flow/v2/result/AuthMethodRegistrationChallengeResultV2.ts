/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { AuthMethodVerificationRequiredStateV2 } from "../state/AuthMethodVerificationRequiredStateV2.js";

/**
 * States returned after requesting an authentication-method registration challenge.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type AuthMethodRegistrationChallengeResultStateV2 =
    | AuthMethodVerificationRequiredStateV2
    | FailedStateV2;

/**
 * Result of challenging a selected authentication method for registration.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type AuthMethodRegistrationChallengeResultV2 =
    CustomAuthResultV2<AuthMethodRegistrationChallengeResultStateV2>;
