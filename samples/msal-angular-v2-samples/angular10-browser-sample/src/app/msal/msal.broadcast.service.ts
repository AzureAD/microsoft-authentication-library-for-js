import { Inject, Injectable } from '@angular/core';
import { BroadcastService, BroadcastEvent, IPublicClientApplication, AuthenticationResult, AuthError } from '@azure/msal-browser';
import { Observable } from 'rxjs';
import { MSAL_INSTANCE } from "./constants";
  
@Injectable()
export class BrowserBroadcastService {
  // private broadcastService: BroadcastService;

  constructor(
    @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication,
  ) {}

  get msalSubject$(): Observable<any> {
    return this.msalInstance.broadcastService.msalSubject$;
  }

  broadcast(type: BroadcastEvent, payload: AuthenticationResult | AuthError) {
    this.msalInstance.broadcast(type, payload);
  }
}
