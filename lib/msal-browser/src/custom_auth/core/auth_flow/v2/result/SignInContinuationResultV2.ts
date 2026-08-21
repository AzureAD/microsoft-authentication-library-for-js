/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { SignInContinuationErrorV2 } from "../error/SignInContinuationErrorV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { CompletedStateV2 } from "../state/CompletedStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";

/**
 * The states a V2 continuation sign-in can resolve to. Signing in redeems the
 * flow continuation for tokens, so the terminal
 * `CompletedStateV2` carries `CustomAuthAccountData`. `CompletedStateV2` and the
 * account payload are declared together because they always occur together.
 */
export type SignInContinuationResultStateV2 = CompletedStateV2 | FailedStateV2;

/**
 * Result of signing the user in from a V2 continuation. It wraps one of
 * {@link SignInContinuationResultStateV2} plus, on failure, a
 * {@link SignInContinuationErrorV2}, and on success carries the signed-in
 * account data. This is the flow's completion point, so a successful result
 * reaches `CompletedStateV2`.
 */
export type SignInContinuationResultV2 = CustomAuthResultV2<
    SignInContinuationResultStateV2,
    SignInContinuationErrorV2,
    CustomAuthAccountData
>;
