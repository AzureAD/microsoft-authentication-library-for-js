/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ChallengeResultV2 } from "./BaseResultsV2.js";

export interface SignUpAttributeV2 {
    attributeId: string;
    inputType?: string;
    required?: boolean;
    canChange?: boolean;
    label?: string;
    regex?: string;
    confirmationInput?: string;
}

export interface SignUpStartApiResultV2 {
    continuationToken: string;
    submitAttributesHref: string;
    attributes?: SignUpAttributeV2[];
}

export const SignUpSubmitAttributesNextActionV2 = {
    VERIFY: "verify",
    COLLECT_ATTRIBUTES: "collectAttributes",
    CONTINUE: "continue",
} as const;

export type SignUpSubmitAttributesApiResultV2 =
    | (ChallengeResultV2 & {
          nextAction: typeof SignUpSubmitAttributesNextActionV2.VERIFY;
          attributes?: SignUpAttributeV2[];
      })
    | {
          nextAction: typeof SignUpSubmitAttributesNextActionV2.COLLECT_ATTRIBUTES;
          continuationToken: string;
          attributes: SignUpAttributeV2[];
          submitAttributesHref: string;
      }
    | {
          nextAction: typeof SignUpSubmitAttributesNextActionV2.CONTINUE;
          continuationToken: string;
      };
