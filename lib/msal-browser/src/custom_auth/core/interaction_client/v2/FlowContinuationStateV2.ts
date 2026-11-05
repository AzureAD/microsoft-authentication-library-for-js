/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthFlowScenarioV2 } from "../../auth_flow/v2/CustomAuthFlowScenarioV2.js";
import type { UserAccountAttributes } from "../../../UserAccountAttributes.js";

export interface FlowLinksV2 {
    challenge?: string;
    verify?: string;
    activate?: string;
    resend?: string;
    update?: string;
    poll?: string;
    submitAttributes?: string;
}

export interface FlowContinuationStateV2 {
    continuationToken: string;
    scenario: CustomAuthFlowScenarioV2;
    scopes: string[];
    links: FlowLinksV2;
    signUp?:
        | {
              purpose: "existingAccount";
              pendingProfileAttributes?: never;
              submittedAttributeIds?: never;
          }
        | {
              purpose: "newAccount";
              pendingProfileAttributes?: Readonly<UserAccountAttributes>;
              submittedAttributeIds: readonly string[];
          };
}
