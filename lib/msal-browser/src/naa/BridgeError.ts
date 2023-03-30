/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerStatusCode } from "./BridgeStatusCode";

export type BridgeError = {
    status: BrokerStatusCode;
    code: string; // auth_flow_last_error such as invalid_grant
    subError: string; // server_suberror_code such as consent_required
    description: string;
    properties: object; // additional telemetry info
};
