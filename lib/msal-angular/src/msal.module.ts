import { Injectable, ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MsalService, MSAL_CONFIG, MSAL_CONFIG_ANGULAR } from "./msal.service";
import { MsalGuard } from "./msal-guard.service";
import { BroadcastService } from "./broadcast.service";
import { Configuration } from "msal";
import { MsalAngularConfiguration, defaultMsalAngularConfiguration } from "./msal-angular.configuration";

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
   static forRoot(
       config: Configuration,
       angularConfig: MsalAngularConfiguration = defaultMsalAngularConfiguration
    ): ModuleWithProviders {
    return {
      ngModule: MsalModule,
      providers: [
        {
            provide: MSAL_CONFIG,
            useValue: config
        },
        {
            provide: MSAL_CONFIG_ANGULAR,
            useValue: angularConfig
        },
        MsalService,
        {
            provide: WindowWrapper,
            useValue: window
        }
      ]
    }
  }

}

