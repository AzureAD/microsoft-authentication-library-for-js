/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationUrlRequest } from "./AuthorizationUrlRequest";

export type InteractiveRequest = Pick<AuthorizationUrlRequest, "authority"|"correlationId"|"claims"|"azureCloudOptions"|"account"|"extraQueryParameters"|"tokenQueryParameters"|"extraScopesToConsent"|"loginHint"|"prompt"> & {
    openBrowser: (url: string) => Promise<void>;
    scopes?: Array<string>;
    successTemplate?: string;
    errorTemplate?: string;
};
