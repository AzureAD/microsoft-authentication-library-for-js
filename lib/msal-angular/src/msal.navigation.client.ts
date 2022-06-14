/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NavigationClient, NavigationOptions, UrlString } from "@azure/msal-browser";
import { Router } from "@angular/router";
import { Location } from "@angular/common";
import { MsalService } from "./msal.service";
import { Injectable } from "@angular/core";

/**
 * Custom navigation used for Angular client-side navigation.
 * See performance doc for details:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/performance.md
 */
@Injectable()
export class MsalCustomNavigationClient extends NavigationClient {

    constructor(
        private authService: MsalService,
        private router: Router, 
        private location: Location
    ) {
        super();
    }

    async navigateInternal(url:string, options: NavigationOptions): Promise<boolean> {
        this.authService.getLogger().trace("MsalCustomNavigationClient called");
        
        this.authService.getLogger().verbose("MsalCustomNavigationClient - navigating");
        this.authService.getLogger().verbosePii(`MsalCustomNavigationClient - navigating to url: ${url}`);
        
        // Prevent hash clearing from causing an issue with Client-side navigation after redirect is handled
        if (options.noHistory) {
            return super.navigateInternal(url, options);
        } else {
            // Normalizing newUrl if no query string
            const urlComponents = new UrlString(url).getUrlComponents();
            const newUrl = urlComponents.QueryString ? `${urlComponents.AbsolutePath}?${urlComponents.QueryString}` : this.location.normalize(urlComponents.AbsolutePath);
            this.router.navigateByUrl(newUrl, { replaceUrl: options.noHistory });
        }
        return Promise.resolve(options.noHistory);
    }
}
