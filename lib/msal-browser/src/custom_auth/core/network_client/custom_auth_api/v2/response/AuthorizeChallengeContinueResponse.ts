/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Continue/resume (authorize-challenge): HTTP 200 returning the authorization `code`, which
 * is then redeemed at the token endpoint. Paired with `AuthorizeChallengeContinueRequest`.
 * The captured wire returns only `code`.
 */
export interface AuthorizeChallengeContinueResponse {
    code?: string;
}
