/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
    AuthenticationFactorV2,
    EnrollmentMethodV2,
    StartMethodV2,
} from "./BaseResultsV2.js";
import {
    CHALLENGE_RELATION,
    ENROLL_RELATION,
    POLL_RELATION,
    ResponseStateV2,
} from "../ApiClientConstantsV2.js";

/*
 * Reset-password response contracts used by the controller. Shared response
 * contracts are defined in `BaseResultsV2`.
 */

// Result of submitting the new password: where to poll for completion.
export interface ResetPasswordUpdateResultV2 {
    continuationToken: string;
    pollHref: string;
}

export type ResetPasswordPollResultV2 =
    | {
          nextAction: typeof POLL_RELATION;
          continuationToken: string;
          pollHref: string;
      }
    | {
          nextAction: typeof ENROLL_RELATION;
          continuationToken: string;
          methods: EnrollmentMethodV2[];
      }
    | {
          nextAction: typeof CHALLENGE_RELATION;
          continuationToken: string;
          authenticationFactor: AuthenticationFactorV2;
          methods: StartMethodV2[];
      }
    | {
          nextAction: typeof ResponseStateV2.CONTINUE;
          continuationToken: string;
      };
