/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class UrlUtils {

    /**
     * Returns current window URL as redirect uri
     */
    static getDefaultRedirectUri(): string {
        return window.location.href.split("?")[0].split("#")[0];
    }

}
