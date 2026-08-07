/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2OAuthFormRequest } from "../shared/V2OAuthFormRequest.js";

/*
 * Entry (POST /oauth2/v2.0/authorize-challenge): the flow's front door. OAuth form-encoded
 * and carries only `client_id` (via V2OAuthFormRequest). The response
 * (`AuthorizeChallengeEntryResponse`) returns the seed `continuation_token` and the flat
 * `reset_password`/`sign_in`/`sign_up` hrefs; SSPR follows `reset_password` into step 2.
 */
export type AuthorizeChallengeEntryRequest = V2OAuthFormRequest;
