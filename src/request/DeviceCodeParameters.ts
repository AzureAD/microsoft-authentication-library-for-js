/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CancellationToken } from "./CancellationToken";
import { DeviceCodeResponse } from "../response/DeviceCodeResponse";

/**
 * Parameters for Oauth2 device code flow. 
 */
export type DeviceCodeParameters = {

    /**
     * Callback containing device code response. Message should be shown to end user. End user can then navigate to the verification_uri, 
     * input the user_code, and input credentials.    
     */
    deviceCodeCallback: (response: DeviceCodeResponse) => void;

    /**
     * Scopes to which the application is requesting access to. 
     */
    scopes?: Array<string>;

    /**
     * Cancellation token used for cancelling the device code request. 
     * 
     * While the user authenticates on a separate device, MSAL polls the the token endpoint of security token service for the interval 
     * specified in the device code resonse (usually 15 minutes). To stop polling and cancel the request, set cancellationToken.cancel = true. 
     */
    cancellationToken?: CancellationToken;

    authority?: string;
};
