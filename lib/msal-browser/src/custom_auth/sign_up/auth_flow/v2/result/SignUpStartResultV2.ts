/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { CodeRequiredStateV2 } from "../../../../core/auth_flow/v2/state/CodeRequiredStateV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { ExistingAccountCodeRequiredStateV2 } from "../state/ExistingAccountCodeRequiredStateV2.js";
import type { ExistingAccountPasswordRequiredStateV2 } from "../state/ExistingAccountPasswordRequiredStateV2.js";
import type { AuthMethodSelectionRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";

/**
 * States returned when native auth V2 sign-up starts.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type SignUpStartResultStateV2 =
    | CodeRequiredStateV2
    | ExistingAccountCodeRequiredStateV2
    | ExistingAccountPasswordRequiredStateV2
    | AuthMethodSelectionRequiredStateV2
    | FailedStateV2;

/**
 * Result of starting native auth V2 sign-up.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type SignUpStartResultV2 = CustomAuthResultV2<SignUpStartResultStateV2>;
