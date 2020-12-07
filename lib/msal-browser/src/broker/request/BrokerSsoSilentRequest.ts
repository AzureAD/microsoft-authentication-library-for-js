/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokeredAuthorizationUrlRequest } from "@azure/msal-common";
import { SsoSilentRequest } from "../../request/SsoSilentRequest";

export type BrokerSsoSilentRequest = BrokeredAuthorizationUrlRequest & SsoSilentRequest;
