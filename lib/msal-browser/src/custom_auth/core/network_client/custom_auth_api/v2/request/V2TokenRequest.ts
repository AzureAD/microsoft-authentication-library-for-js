/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2OAuthFormRequest } from "../shared/V2OAuthFormRequest.js";

/*
 * Step 8 token exchange (POST /oauth2/v2.0/token). Redeems the authorization `code` for
 * tokens. OAuth form-encoded, so it carries `client_id` (via V2OAuthFormRequest). The
 * always-on `client_info=1` is set by the api-client (as in V1's SignInApiClient), so it is
 * not declared here. `claims` is an optional app-provided OAuth claims-request JSON string.
 */
export interface V2TokenRequest extends V2OAuthFormRequest {
    grant_type: string;
    code: string;
    scope?: string;
    claims?: string;
}
