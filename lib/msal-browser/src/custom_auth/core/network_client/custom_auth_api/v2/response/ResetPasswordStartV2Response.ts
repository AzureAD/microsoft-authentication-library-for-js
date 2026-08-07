/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HalEmbedded } from "../shared/HalResource.js";
import { V2HalResponseBase } from "../shared/V2ApiResponseBase.js";
import { V2ChallengeContext } from "../shared/V2ChallengeContext.js";
import { V2EmbeddedMethod } from "../shared/V2EmbeddedMethod.js";

/*
 * Resetpassword start: `state: interactionRequired`, `action: challenge`. The only relation
 * the flow navigates is the per-method `challenge` href under `_embedded.methods[i]._links`
 * (see V2EmbeddedMethod), so only `_embedded.methods` is narrowed. Top-level `_links`
 * (self/cancel/resume/curies) are informational and never followed, so they are left to the
 * generic HAL index signature (matches iOS, which captures them generically but never reads
 * them). `_embedded.user[]` is likewise present but not navigated (left generic). Presence of
 * a required relation is enforced at parse time (L2-T2b).
 */
export interface ResetPasswordStartV2Response extends V2HalResponseBase {
    challengeContext?: V2ChallengeContext;
    _embedded?: HalEmbedded & {
        methods?: V2EmbeddedMethod[];
    };
}
