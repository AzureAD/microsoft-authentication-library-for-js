/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { ResetPasswordStartErrorV2 } from "../error/ResetPasswordStartErrorV2.js";
import type { AuthenticationMethodSelectionRequiredStateV2 } from "../state/AuthenticationMethodSelectionRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";

/**
 * The states a reset-password (V2) entry operation can resolve to. On success
 * the server drives the flow to `AuthenticationMethodSelectionRequiredStateV2`;
 * `FailedStateV2` carries a terminal error.
 */
export type ResetPasswordStartResultStateV2 =
    | AuthenticationMethodSelectionRequiredStateV2
    | FailedStateV2;

/**
 * Result of starting a native auth V2 reset-password operation. It is returned
 * by `resetPasswordV2` and wraps one of {@link ResetPasswordStartResultStateV2}
 * plus, on failure, a {@link ResetPasswordStartErrorV2}.
 */
export type ResetPasswordStartResultV2 = CustomAuthResultV2<
    ResetPasswordStartResultStateV2,
    ResetPasswordStartErrorV2
>;
