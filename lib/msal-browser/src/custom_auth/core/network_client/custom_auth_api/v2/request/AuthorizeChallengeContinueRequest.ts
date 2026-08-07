/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2OAuthFormRequest } from "../shared/V2OAuthFormRequest.js";

/*
 * Resume (POST /oauth2/v2.0/authorize-challenge): redeem the continuation token for an
 * authorization code. OAuth form-encoded, so it carries `client_id` (via V2OAuthFormRequest)
 * alongside `continuation_token`.
 */
export interface AuthorizeChallengeContinueRequest extends V2OAuthFormRequest {
    continuation_token: string;
}
