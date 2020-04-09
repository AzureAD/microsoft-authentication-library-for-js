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
    cancel?: false;

    /**
     * URI of the authority from which MSAL will acquire the tokens from. If this value is not set, MSAL defaults
     * to the authority used when configuring the PublicClientApplication.
     */
    authority?: string;
};
