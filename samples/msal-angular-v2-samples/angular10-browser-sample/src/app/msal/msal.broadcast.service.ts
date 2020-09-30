import { Inject, Injectable } from '@angular/core';
import { BroadcastMessage, BroadcastEvent, IPublicClientApplication, AuthenticationResult, AuthError } from '@azure/msal-browser';
import { Observable, Subject } from 'rxjs';
import { MSAL_INSTANCE } from "./constants";
  
@Injectable()
export class BrowserBroadcastService {
  private _msalSubject: Subject<any>;
  public localMsalSubject$: Observable<any>;

  constructor(
    @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication,
  ) {
    // Converting simple callback from msal-browser to observable
    this._msalSubject = new Subject<BroadcastMessage>();
    this.localMsalSubject$  = this._msalSubject.asObservable();
    this.msalInstance.subscribe((type: BroadcastEvent, payload: AuthenticationResult | AuthError) => {
      this._msalSubject.next({type, payload});
    })
  }

  // Subject from msal-browser
  get msalSubject$(): Observable<any> {
    return this.msalInstance.broadcastService.msalSubject$;
  }

  broadcast(type: BroadcastEvent, payload: AuthenticationResult | AuthError) {
    this.msalInstance.broadcast(type, payload);
  }
}
