/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INavigationClient } from "./INavigationClient.js";
import { NavigationOptions } from "./NavigationOptions.js";

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

    private static isSafeUrl(url: string): boolean {
        try {
            const parsed = new URL(url, window.location.origin);
            return ["http:", "https:"].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    private static escapeForLogging(url: string): string {
        return url
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
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
        const validatedUrl = this.escapeForLogging(url);
        if (this.isSafeUrl(validatedUrl)) {
            if (options.noHistory) {
                window.location.replace(validatedUrl);
            } else {
                window.location.assign(validatedUrl);
            }
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, options.timeout);
        });
    }
}
