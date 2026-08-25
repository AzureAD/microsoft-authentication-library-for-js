/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthFlowScenarioV2 } from "../../auth_flow/v2/CustomAuthFlowScenarioV2.js";

/*
 * Server-provided `_links` hrefs used to continue a flow. Each response supplies
 * the links needed for the next action.
 */
export interface FlowLinksV2 {
    challenge?: string;
    verify?: string;
    resend?: string;
    update?: string;
    poll?: string;
    continue?: string;
}

/*
 * Opaque state used to resume a server-driven flow. It carries the continuation
 * token, scenario, and server-provided links without exposing them to the app.
 */
export interface FlowContinuationStateV2 {
    continuationToken: string;
    scenario: CustomAuthFlowScenarioV2;
    links: FlowLinksV2;
}
