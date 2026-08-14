/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2FlowScenario } from "../../auth_flow/CustomAuthV2FlowScenario.js";

/*
 * Server-provided `_links` hrefs for the next step(s) of a flow, resolved from the previous HAL
 * response. Each step reads the href it needs (e.g. `verify` to submit a code) and re-emits the
 * hrefs advertised by its own response for the step that follows.
 */
export interface V2FlowLinks {
    challenge?: string;
    verify?: string;
    resend?: string;
    update?: string;
    poll?: string;
    continue?: string;
}

/*
 * Opaque continuation handed between interaction-client steps. It is the JS analogue of the iOS
 * `MSALNativeAuthFlowContinuationState`: everything needed to resume a server-driven flow at the
 * next step - the continuation token to present, the scenario being driven, and the next-step
 * hrefs. The scenario is injected by the flow-specific controller (it is the generic client's flow
 * identity) and re-emitted so downstream results/errors can be tagged with the originating flow.
 * Public L1 states carry this back into the client on the next action; it is never exposed to the
 * application.
 */
export interface V2FlowContinuationState {
    continuationToken: string;
    scenario: CustomAuthV2FlowScenario;
    links: V2FlowLinks;
}
