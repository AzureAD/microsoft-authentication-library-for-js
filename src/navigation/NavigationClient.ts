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
    navigateInternal(url: string, options: NavigationOptions): Promise<boolean>{
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

    /**
     * Navigates to other pages outside the web application i.e. the Identity Provider
     * @param url 
     * @param options 
     */
    navigateExternal(url: string, options: NavigationOptions): Promise<boolean> {
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
