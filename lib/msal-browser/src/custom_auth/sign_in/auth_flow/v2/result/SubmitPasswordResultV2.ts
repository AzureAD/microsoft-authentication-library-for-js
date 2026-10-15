/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { MFARequiredStateV2 } from "../../../../core/auth_flow/v2/state/MFARequiredStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { SubmitPasswordErrorV2 } from "../error_type/SubmitPasswordErrorV2.js";

export type SubmitPasswordResultStateV2 =
    | CompletedStateV2
    | MFARequiredStateV2
    | FailedStateV2;

export type SubmitPasswordResultV2 = CustomAuthResultV2<
    SubmitPasswordResultStateV2,
    SubmitPasswordErrorV2,
    CustomAuthAccountData | undefined
>;
