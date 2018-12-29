import {MsalConfig} from "./msal-config";
import { MsalService, MSAL_CONFIG} from "./msal.service";
import {MsalGuard} from "./msal-guard.service";
import {BroadcastService} from "./broadcast.service";
import { Injectable, Inject, PLATFORM_ID, InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { isPlatformBrowser,CommonModule } from '@angular/common';

@Injectable()
export class WindowService {
    private _window: Window;
    constructor(@Inject(PLATFORM_ID) platformId: any) {
        if (!isPlatformBrowser(platformId)) {
            this._window = {navigator: {userAgent: 'fakeAgent'}} as Window;
        } else {
            this._window = window;
        }
    }

    get nativeWindow(): any {
        return this._window;
    }
}

@NgModule({
  imports: [CommonModule],
    declarations: [

    ],
  providers: [MsalGuard, BroadcastService],
})
export class MsalModule {
  constructor(private windowService :WindowService){
    if(window == undefined){
      global['window'] = windowService.nativeWindow();
      global['WindowWrapper'] = windowService.nativeWindow();
    }
  }
   static forRoot(config: MsalConfig ): ModuleWithProviders {
    return {
      ngModule: MsalModule,
      providers: [
          {provide: MSAL_CONFIG, useValue: config} ,   MsalService 
      ]
    }
  }

}

