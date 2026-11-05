/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { CodeRequiredStateV2 } from "../state/CodeRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { MFAVerificationRequiredStateV2 } from "../state/MFAVerificationRequiredStateV2.js";
import type { PasswordRequiredStateV2 } from "../state/PasswordRequiredStateV2.js";
import type { ExistingAccountCodeRequiredStateV2 } from "../../../../sign_up/auth_flow/v2/state/ExistingAccountCodeRequiredStateV2.js";
import type { ExistingAccountPasswordRequiredStateV2 } from "../../../../sign_up/auth_flow/v2/state/ExistingAccountPasswordRequiredStateV2.js";

/**
 * States returned after requesting an authentication challenge.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type RequestChallengeResultStateV2 =
    | CodeRequiredStateV2
    | MFAVerificationRequiredStateV2
    | PasswordRequiredStateV2
    | ExistingAccountCodeRequiredStateV2
    | ExistingAccountPasswordRequiredStateV2
    | FailedStateV2;

/**
 * Result of requesting an authentication challenge.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type RequestChallengeResultV2 =
    CustomAuthResultV2<RequestChallengeResultStateV2>;
