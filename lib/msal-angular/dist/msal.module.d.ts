import { MsalConfig } from "./msal-config";
import { ModuleWithProviders } from "@angular/core";
export declare class WindowWrapper extends Window {
}
export declare class MsalModule {
    static forRoot(config: MsalConfig): ModuleWithProviders;
}
