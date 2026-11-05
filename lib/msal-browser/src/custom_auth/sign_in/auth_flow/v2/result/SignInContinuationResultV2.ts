/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";

/**
 * States returned when signing in from a V2 continuation.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type SignInContinuationResultStateV2 = CompletedStateV2 | FailedStateV2;

/**
 * Result of signing the user in from a V2 continuation.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type SignInContinuationResultV2 = CustomAuthResultV2<
    SignInContinuationResultStateV2,
    CustomAuthAccountData
>;
