/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SsoSilentRequest } from "../../request/SsoSilentRequest";

export type BrokerSsoSilentRequest = SsoSilentRequest & {
    embeddedAppClientId: string;
    brokerRedirectUri: string;
};
