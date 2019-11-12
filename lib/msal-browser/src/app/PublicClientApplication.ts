/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Interface to handle iFrame generation, Popup Window creation and redirect handling
 */
declare global {
    interface Window {
        openedWindows: Array<Window>;
    }
}

/**
 * Key-Value type to support queryParams, extraQueryParams and claims
 */
export type StringDict = {[key: string]: string};

export class PublicClientApplication {
    
}
