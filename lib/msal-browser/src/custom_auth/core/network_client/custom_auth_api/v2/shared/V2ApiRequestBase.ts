/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-common/browser";

/*
 * Cross-cutting fields every V2 request carries alongside its wire body; they are NOT
 * serialized into the body. `correlationId` correlates request/response and
 * `telemetryManager` carries server telemetry. `client_id` is NOT here: it is a body field
 * on the OAuth form endpoints only (declared via `V2OAuthFormRequest`); the HAL /api
 * endpoints send JSON bodies without `client_id`.
 */
export type V2ApiRequestBase = {
    correlationId: string;
    telemetryManager: ServerTelemetryManager;
};
