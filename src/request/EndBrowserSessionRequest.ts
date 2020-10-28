/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EndSessionRequest } from "@azure/msal-common";

export type EndBrowserSessionRequest = Partial<EndSessionRequest> & {
    authority?: string;
};
