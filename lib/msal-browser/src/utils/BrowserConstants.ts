/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Constants
 */
export const BrowserConstants = {
    // Local storage constant string
    CACHE_LOCATION_LOCAL: "localStorage",
    // Session storage constant string
    CACHE_LOCATION_SESSION: "sessionStorage",
    // Interaction status key (only used for browsers)
    INTERACTION_STATUS_KEY: "interaction.status",
    // Interaction in progress cache value
    INTERACTION_IN_PROGRESS_VALUE: "interaction_in_progress",
    // Default popup window width
    POPUP_WIDTH: 483,
    // Default popup window height
    POPUP_HEIGHT: 600,
    // Default popup monitor poll interval in milliseconds
    POLL_INTERVAL_MS: 50,
    // msal-browser SKU
    MSAL_SKU: "msal.js.browser",
};

/**
 * HTTP Request types supported by MSAL.
 */
export enum HTTP_REQUEST_TYPE {
    GET = "GET",
    POST = "POST"
};
