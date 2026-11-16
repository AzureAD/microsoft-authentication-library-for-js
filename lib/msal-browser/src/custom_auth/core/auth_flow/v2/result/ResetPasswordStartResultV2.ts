/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { AuthMethodSelectionRequiredStateV2 } from "../state/AuthMethodSelectionRequiredStateV2.js";
import type { CodeRequiredStateV2 } from "../state/CodeRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";

/**
 * States returned when native auth V2 password reset starts.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type ResetPasswordStartResultStateV2 =
    | AuthMethodSelectionRequiredStateV2
    | CodeRequiredStateV2
    | FailedStateV2;

/**
 * Result of starting native auth V2 password reset.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type ResetPasswordStartResultV2 =
    CustomAuthResultV2<ResetPasswordStartResultStateV2>;
