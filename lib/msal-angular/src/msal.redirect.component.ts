/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * This is a dedicated redirect component to be added to Angular apps to 
 * handle redirects when using @azure/msal-angular.
 * Import this component to use redirects in your app.
 */

import { Component, OnInit } from "@angular/core";
import { MsalService } from "./msal.service";

@Component({
    selector: "app-redirect",
    template: ""
})
export class MsalRedirectComponent implements OnInit {

    constructor(private authService: MsalService) { }

    ngOnInit(): void {    
        this.authService.handleRedirectObservable().subscribe();
    }

}
