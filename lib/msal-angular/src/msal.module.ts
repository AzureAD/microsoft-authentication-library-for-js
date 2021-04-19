/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IPublicClientApplication } from "@azure/msal-browser";
import { MsalGuardConfiguration } from "./msal.guard.config";
import { MsalInterceptorConfiguration } from "./msal.interceptor.config";
import { MsalGuard } from "./msal.guard";
import { MsalBroadcastService } from "./msal.broadcast.service";
import { MsalService } from "./msal.service";
import { MSAL_INSTANCE , MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG } from "./constants";
import { MsalRedirectComponent } from "./msal.redirect.component";

@NgModule({
    declarations: [MsalRedirectComponent],
    imports: [
        CommonModule
    ],
    providers: [
        MsalGuard,
        MsalBroadcastService
    ]
})
export class MsalModule {
    static forRoot(
        msalInstance: IPublicClientApplication,
        guardConfig: MsalGuardConfiguration,
        interceptorConfig: MsalInterceptorConfiguration
    ): ModuleWithProviders<MsalModule> {
        return {
            ngModule: MsalModule,
            providers: [
                {
                    provide: MSAL_INSTANCE,
                    useValue: msalInstance
                },
                {
                    provide: MSAL_GUARD_CONFIG,
                    useValue: guardConfig
                },
                {
                    provide: MSAL_INTERCEPTOR_CONFIG,
                    useValue: interceptorConfig
                },
                MsalService
            ]
        };
    }

}
