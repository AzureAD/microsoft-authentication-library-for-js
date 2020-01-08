/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Constants
 */
export const BrowserConstants = {
    CACHE_LOCATION_LOCAL: "localStorage",
    CACHE_LOCATION_SESSION: "sessionStorage",
    INTERACTION_STATUS_KEY: "interaction.status",
    INTERACTION_IN_PROGRESS: "interaction_in_progress",
    POPUP_WIDTH: 483,
    POPUP_HEIGHT: 600,
    POPUP_POLL_INTERVAL_MS: 50
};

export enum HTTP_REQUEST_TYPE {
    GET = "GET",
    POST = "POST"
};
