import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MsalBroadcastEvent } from './constants';
import { AuthenticationResult, AuthError } from '@azure/msal-browser';

export interface MsalBroadcastMessage {
  type: MsalBroadcastEvent;
  payload: AuthenticationResult | AuthError;
}

@Injectable()
export class MsalBroadcastService {
  private _msalSubject: Subject<any>;
  public msalSubject$: Observable<any>;

  constructor() {
    this._msalSubject = new Subject<MsalBroadcastMessage>();
    this.msalSubject$  = this._msalSubject.asObservable();
  }

  broadcast(type: MsalBroadcastEvent, payload: AuthenticationResult | AuthError) {

    this._msalSubject.next({type , payload});
  }
}
