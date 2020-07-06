/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationUrlRequest } from "@azure/msal-common";

/**
 * @type PopupRequest: Request object passed by user to retrieve a Code from the
 * server (first leg of authorization code grant flow)
 */
export type PopupRequest = AuthorizationUrlRequest;
