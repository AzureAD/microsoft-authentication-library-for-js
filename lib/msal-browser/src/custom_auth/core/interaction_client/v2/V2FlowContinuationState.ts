/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2FlowScenario } from "../../auth_flow/v2/CustomAuthV2FlowScenario.js";

/*
 * Server-provided `_links` hrefs used to continue a flow. Each response supplies
 * the links needed for the next action.
 */
export interface V2FlowLinks {
    challenge?: string;
    verify?: string;
    update?: string;
    poll?: string;
    continue?: string;
}

/*
 * Opaque state used to resume a server-driven flow. It carries the continuation
 * token, scenario, and server-provided links without exposing them to the app.
 */
export interface V2FlowContinuationState {
    continuationToken: string;
    scenario: CustomAuthV2FlowScenario;
    links: V2FlowLinks;
}
