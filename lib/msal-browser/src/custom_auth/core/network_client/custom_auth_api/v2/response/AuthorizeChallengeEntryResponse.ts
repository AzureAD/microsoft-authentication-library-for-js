/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2OAuthErrorResponse } from "../shared/V2ApiResponseBase.js";

/*
 * Entry (authorize-challenge): a non-200 (iOS: 401; captured wire: 403). Success is
 * signalled by the presence of `continuation_token` and the flat `reset_password` href,
 * NOT by the `error` field. `error` here is an OAuth string (e.g. "InsufficientAuthorization"),
 * distinct from the nested error object on the /api HAL endpoints. The follow-up hrefs
 * (`reset_password`, `sign_in`, `sign_up`) are FLAT top-level strings, not HAL `_links`;
 * SSPR follows `reset_password`.
 */
export interface AuthorizeChallengeEntryResponse extends V2OAuthErrorResponse {
    reset_password?: string;
    sign_in?: string;
    sign_up?: string;
}
