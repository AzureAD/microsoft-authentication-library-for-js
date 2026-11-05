/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { EnrollmentMethodV2 } from "./BaseResultsV2.js";

export interface ResetPasswordUpdateResultV2 {
    continuationToken: string;
    pollHref: string;
}

export interface ResetPasswordPollResultV2 {
    continuationToken: string;
    nextAction: string;
    pollHref?: string;
    enrollmentMethods?: EnrollmentMethodV2[];
}
