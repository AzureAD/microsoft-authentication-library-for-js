/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { AuthMethodRegistrationRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import type { AuthMethodSelectionRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import type { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";

/**
 * States returned after submitting an existing-account code during sign-up.
 * Authentication can complete or require enrollment or MFA method selection.
 */
export type ExistingAccountSubmitCodeResultStateV2 =
    | AuthMethodSelectionRequiredStateV2
    | AuthMethodRegistrationRequiredStateV2
    | CompletedStateV2
    | FailedStateV2;

/**
 * Result of submitting an existing-account code during sign-up. Account data
 * is present when authentication completes successfully.
 */
export type ExistingAccountSubmitCodeResultV2 = CustomAuthResultV2<
    ExistingAccountSubmitCodeResultStateV2,
    CustomAuthAccountData | undefined
>;

/**
 * States returned after submitting an existing-account password during sign-up.
 * Authentication can complete or require enrollment or MFA method selection.
 */
export type ExistingAccountSubmitPasswordResultStateV2 =
    | AuthMethodSelectionRequiredStateV2
    | AuthMethodRegistrationRequiredStateV2
    | CompletedStateV2
    | FailedStateV2;

/**
 * Result of submitting an existing-account password during sign-up. Account
 * data is present when authentication completes successfully.
 */
export type ExistingAccountSubmitPasswordResultV2 = CustomAuthResultV2<
    ExistingAccountSubmitPasswordResultStateV2,
    CustomAuthAccountData | undefined
>;
