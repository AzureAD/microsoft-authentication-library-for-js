import { Inject, Injectable } from '@angular/core';
import { BroadcastMessage, IPublicClientApplication } from '@azure/msal-browser';
import { Observable, Subject } from 'rxjs';
import { MSAL_INSTANCE } from "./constants";
  
@Injectable()
export class MsalBroadcastService {
  private _msalSubject: Subject<any>;
  public msalSubject$: Observable<any>;

  constructor(
    @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication,
  ) {
    this._msalSubject = new Subject<BroadcastMessage>();
    this.msalSubject$  = this._msalSubject.asObservable();
    this.msalInstance.addEventCallback((message: BroadcastMessage) => {
      this._msalSubject.next(message);
    })
  }
}
