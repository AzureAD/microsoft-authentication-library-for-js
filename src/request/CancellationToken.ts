/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
* Cancellation token used for cancelling the device code request. 
* 
* While the user authenticates on a separate device, MSAL polls the the token endpoint of security token service for the interval 
* specified in the device code resonse (usually 15 minutes). To stop polling and cancel the request, set cancellationToken.cancel = true. 
* */
export class CancellationToken {

    /**
     * To stop device code polling and cancel the request, set cancellationToken.cancel = true
     */
    public cancel: boolean = false;
}
