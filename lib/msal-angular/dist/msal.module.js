import { Injectable, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MsalService, MSAL_CONFIG } from "./msal.service";
import { MsalGuard } from "./msal-guard.service";
import { BroadcastService } from "./broadcast.service";
Injectable();
export class WindowWrapper extends Window {
}
export class MsalModule {
    static forRoot(config) {
        return {
            ngModule: MsalModule,
            providers: [
                { provide: MSAL_CONFIG, useValue: config }, MsalService, { provide: WindowWrapper, useValue: window }
            ]
        };
    }
}
MsalModule.decorators = [
    { type: NgModule, args: [{
                imports: [CommonModule],
                declarations: [],
                providers: [MsalGuard, BroadcastService],
            },] },
];
/** @nocollapse */
MsalModule.ctorParameters = () => [];
//# sourceMappingURL=msal.module.js.map