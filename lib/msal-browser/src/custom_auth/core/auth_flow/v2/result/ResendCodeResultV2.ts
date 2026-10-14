/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { CodeRequiredStateV2 } from "../state/CodeRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";

/**
 * The states a resend-code action can resolve to.
 */
export type ResendCodeResultStateV2 = CodeRequiredStateV2 | FailedStateV2;

/**
 * Result of requesting a replacement first-factor code. It wraps one of
 * {@link ResendCodeResultStateV2} plus, on failure, the unified V2 flow error.
 */
export type ResendCodeResultV2 = CustomAuthResultV2<ResendCodeResultStateV2>;
