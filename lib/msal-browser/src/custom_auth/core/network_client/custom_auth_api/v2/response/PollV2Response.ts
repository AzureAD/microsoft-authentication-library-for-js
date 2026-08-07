/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HalLinks, HalLink } from "../shared/HalResource.js";
import { V2HalResponseBase } from "../shared/V2ApiResponseBase.js";

/*
 * Step 6 response (`/methods/password/{id}/pollUpdate`). SSPR (recovery) only. The client
 * repeats the poll until `state === "continue"`, at which point the reset has been applied and
 * the top-level `continue` relation appears — its `href` is the OAuth `authorize-challenge`
 * endpoint, bridging back to the token flow to complete the reset. `curies` and
 * `_embedded.user[]` are present on the wire but never navigated, so they are left to the
 * generic HAL index signature.
 */
export interface PollV2Response extends V2HalResponseBase {
    _links?: HalLinks & {
        continue?: HalLink;
    };
}
