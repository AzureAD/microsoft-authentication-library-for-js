/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonEndSessionRequest } from "@azure/msal-common/browser";
import { PopupWindowAttributes } from "./PopupWindowAttributes.js";

/**
 * EndSessionPopupRequest
 */
export type EndSessionPopupRequest = Partial<CommonEndSessionRequest> & {
    /**
     * Authority to send logout request to.
     */
    authority?: string;
    /**
     * URI to navigate the main window to after logout is complete
     * Must be an application-controlled, trusted destination. Validate query parameters and other input that your application does not fully control before using them as the destination.
     * For navigation within your app, validate that the resolved URL uses HTTPS and matches your application's origin.
     */
    mainWindowRedirectUri?: string;
    /**
     * Optional popup window attributes. popupSize with height and width, and popupPosition with top and left can be set.
     */
    popupWindowAttributes?: PopupWindowAttributes;
    /**
     * Optional window object to use as the parent when opening popup windows. Uses global `window` if not given.
     */
    popupWindowParent?: Window;
};
