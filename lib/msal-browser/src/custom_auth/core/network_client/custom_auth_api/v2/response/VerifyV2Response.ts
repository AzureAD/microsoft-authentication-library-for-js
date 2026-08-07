/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HalLinks, HalLink } from "../shared/HalResource.js";
import { V2HalResponseBase } from "../shared/V2ApiResponseBase.js";

/*
 * Step 4 response (email/{id}/verify — OTP accepted). The password method is returned at
 * top-level (not in `_embedded.methods`); `type === "password"` with its method `id` and an
 * empty `payload`. `action: update` — next the user submits the new password via the
 * top-level `update` relation (a PUT to `_links.update.href`, which embeds the method id).
 * `self`/`curies` are informational and `_embedded.user[]` is not navigated, so both are left
 * to the generic HAL index signature.
 */
export interface VerifyV2Response extends V2HalResponseBase {
    id?: string;
    type?: string;
    payload?: Record<string, unknown>;
    _links?: HalLinks & {
        update?: HalLink;
    };
}
