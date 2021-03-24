/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NavigationClient, NavigationOptions, UrlString } from "@azure/msal-browser";
import { Router } from "@angular/router";

/**
 * Custom navigation used for Angular client-side navigation.
 * See performance doc for details:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/performance.md
 */
export class MsalCustomNavigationClient extends NavigationClient {
    private router: Router;

    constructor(router: Router) {
        super();
        this.router = router;
    }

    async navigateInternal(url:string, options: NavigationOptions): Promise<boolean> {
        const urlComponents = new UrlString(url).getUrlComponents();
        
        // Ensures url does not end with / character
        const joinedPathSegments = urlComponents.PathSegments.join("/");

        // Adds query to url if present
        const newUrl = urlComponents.QueryString ? `/${joinedPathSegments}?${urlComponents.QueryString}` : `/${joinedPathSegments}`;

        this.router.navigateByUrl(newUrl);
        return Promise.resolve(false);
    }
}
