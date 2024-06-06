/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INavigationClient } from "./INavigationClient";
import { NavigationOptions } from "./NavigationOptions";

export class NavigationClient implements INavigationClient {
    /**
     * Navigates to other pages within the same web application
     * @param url
     * @param options
     */
    navigateInternal(
        url: string,
        options: NavigationOptions
    ): Promise<boolean> {
        return NavigationClient.defaultNavigateWindow(url, options);
    }

    /**
     * Navigates to other pages outside the web application i.e. the Identity Provider
     * @param url
     * @param options
     */
    navigateExternal(
        url: string,
        options: NavigationOptions
    ): Promise<boolean> {
        return NavigationClient.defaultNavigateWindow(url, options);
    }

    /**
     * Default navigation implementation invoked by the internal and external functions
     * @param url
     * @param options
     */
    private static defaultNavigateWindow(
        url: string,
        options: NavigationOptions
    ): Promise<boolean> {
        if (options.noHistory) {
            window.location.replace(url);
        } else {
            window.location.assign(url);
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, options.timeout);
        });
    }
}
