/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Base for the V2 OAuth form-encoded (`application/x-www-form-urlencoded`) requests:
 * authorize-challenge (entry + resume) and token. Unlike the HAL `/api` JSON endpoints,
 * these OAuth endpoints require `client_id` in the body. It is declared explicitly (not
 * injected by a shared api-client) because the V2 api-client is bespoke and does not reuse
 * the V1 injection layer — mirrors iOS, which threads `clientId` on its token params struct.
 */
export interface V2OAuthFormRequest {
    client_id: string;
}
