/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HalLinks, HalLink } from "../shared/HalResource.js";
import { V2HalResponseBase } from "../shared/V2ApiResponseBase.js";

/*
 * Step 3 response (`/methods/{type}/{id}/challenge`). The challenge shape varies by method
 * type, so it is modelled as a discriminated union keyed on `type`:
 *
 *   - `ChallengeV2ResponseBase` holds the fields common to every challenge: the method `id`,
 *     its `type`, and the universal `verify` relation (submit the credential next).
 *   - `OtpChallengeV2Response` adds the OTP-family fields (`hint`, `codeLength` — which appears
 *     both top-level and under `payload` — and the `resend` relation). These are meaningful
 *     only for code-based methods (email/phone); a password challenge carries none of them.
 *
 * `action: verify` — next the user submits the credential. The actionable relations live at the
 * TOP-LEVEL `_links` (there is no `_embedded.methods` on this step). `self`/`curies` and
 * `_embedded.user[]` are present on the wire but never navigated, so they are left to the
 * generic HAL index signature.
 *
 * Password-based challenge is a future extension point: add a `PasswordChallengeV2Response`
 * member and widen the `ChallengeV2Response` alias, without touching the OTP member.
 */
export interface ChallengeV2ResponseBase extends V2HalResponseBase {
    id?: string;
    type?: string;
    _links?: HalLinks & {
        verify?: HalLink;
    };
}

export interface OtpChallengeV2Response extends ChallengeV2ResponseBase {
    hint?: string;
    codeLength?: number;
    payload?: { codeLength?: number };
    _links?: HalLinks & {
        verify?: HalLink;
        resend?: HalLink;
    };
}

export type ChallengeV2Response = OtpChallengeV2Response;
