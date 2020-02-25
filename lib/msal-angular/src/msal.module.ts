import {MsalConfig} from "./msal-config";
import {Injectable, ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import { MsalService, MSAL_CONFIG} from "./msal.service";
import {MsalGuard} from "./msal-guard.service";
import {BroadcastService} from "./broadcast.service";

Injectable()
export class WindowWrapper extends Window {

}
@NgModule({
  imports: [CommonModule],
    declarations: [

    ],
  providers: [MsalGuard, BroadcastService],
})
export class MsalModule {
   static forRoot(config: (MsalConfig | (() => MsalConfig))): ModuleWithProviders {

        const tokenConfig = typeof config === 'function' ? {
            provide: MSAL_CONFIG,
            useFactory: config,
        } : {
            provide: MSAL_CONFIG,
            useValue: config,
        }
    return {
      ngModule: MsalModule,
      providers: [
        tokenConfig,
        MsalService ,
        {provide :WindowWrapper, useValue: window}
      ]
    }
  }

}

