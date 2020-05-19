/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DeviceCodeResponse } from "../response/DeviceCodeResponse";

/**
 * Parameters for Oauth2 device code flow.
 */
export type DeviceCodeRequest = {

    /**
     * Callback containing device code response. Message should be shown to end user. End user can then navigate to the verification_uri,
     * input the user_code, and input credentials.
     */
    deviceCodeCallback: (response: DeviceCodeResponse) => void;

    /**
     * Scopes to which the application is requesting access to.
     */
    scopes: Array<string>;

    /**
     * Boolean to cancel polling of device code endpoint.
     *
     * While the user authenticates on a separate device, MSAL polls the the token endpoint of security token service for the interval
     * specified in the device code response (usually 15 minutes). To stop polling and cancel the request, set cancel=true;
     */
    cancel?: boolean;

    /**
     * Url of the authority which the application acquires tokens from. Defaults to
     * https://login.microsoftonline.com/common. If using the same authority for all request, authority should set
     * on client application object and not request, to avoid resolving authority endpoints multiple times.
     */
    authority?: string;
};
