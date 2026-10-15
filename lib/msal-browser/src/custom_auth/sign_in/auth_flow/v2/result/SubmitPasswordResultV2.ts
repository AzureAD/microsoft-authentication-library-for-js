/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { AuthMethodSelectionRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";

export type SubmitPasswordResultStateV2 =
    | CompletedStateV2
    | AuthMethodSelectionRequiredStateV2
    | FailedStateV2;

export type SubmitPasswordResultV2 = CustomAuthResultV2<
    SubmitPasswordResultStateV2,
    CustomAuthAccountData | undefined
>;
