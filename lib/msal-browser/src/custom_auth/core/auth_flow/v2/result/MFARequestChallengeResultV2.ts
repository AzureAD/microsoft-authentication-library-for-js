/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import type { ChallengeVerificationRequiredStateV2 } from "../state/ChallengeVerificationRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";

export type MFARequestChallengeResultStateV2 =
    | ChallengeVerificationRequiredStateV2
    | FailedStateV2;

export type MFARequestChallengeResultV2 = CustomAuthResultV2<
    MFARequestChallengeResultStateV2,
    RequestChallengeErrorV2
>;
