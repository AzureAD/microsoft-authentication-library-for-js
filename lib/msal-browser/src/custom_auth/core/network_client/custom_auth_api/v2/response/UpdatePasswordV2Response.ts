/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HalLinks, HalLink } from "../shared/HalResource.js";
import { V2HalResponseBase } from "../shared/V2ApiResponseBase.js";

/*
 * Step 5 response (PUT `/methods/password/{id}` — new password accepted). SSPR (recovery)
 * only. The password method is returned at top-level with an empty `payload`. `action: poll`
 * — the reset is being applied asynchronously; next the client polls the top-level `poll`
 * relation (its `href` targets `.../pollUpdate`) until the reset completes. `self`/`curies`
 * and `_embedded.user[]` are present on the wire but never navigated, so they are left to the
 * generic HAL index signature.
 */
export interface UpdatePasswordV2Response extends V2HalResponseBase {
    id?: string;
    type?: string;
    payload?: Record<string, unknown>;
    _links?: HalLinks & {
        poll?: HalLink;
    };
}
