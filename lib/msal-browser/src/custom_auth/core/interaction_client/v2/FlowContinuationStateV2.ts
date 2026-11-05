/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthFlowScenarioV2 } from "../../auth_flow/v2/CustomAuthFlowScenarioV2.js";

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
    signUp?: {
        passwordWasSupplied: boolean;
    };
}
