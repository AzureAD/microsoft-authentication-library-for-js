import { Inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { InteractionType, MSAL_INSTANCE } from './constants';
import { EventType, EventMessage, EventPayload, EventError, IPublicClientApplication } from '@azure/msal-browser';

@Injectable()
export class MsalBroadcastService {
  private _msalSubject: Subject<any>;
  public msalSubject$: Observable<any>;

  constructor(
    @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication
  ) {
    this._msalSubject = new Subject<EventMessage>();
    this.msalSubject$  = this._msalSubject.asObservable();
    this.msalInstance.addEventCallback((message: EventMessage) => {
      this._msalSubject.next(message);
    });
  }

  /**
   * Broadcasts events from msal-angular, same shape as events from msal-browser
   * @param eventType 
   * @param interactionType 
   * @param payload 
   * @param error 
   */
  broadcastAngularEvent(eventType: EventType, interactionType?: InteractionType, payload?: EventPayload, error?: EventError) {
    const message = {
      eventType: eventType,
      interactionType: interactionType || null,
      payload: payload || null,
      error: error || null,
      timestamp: Date.now()
    };
    
    this._msalSubject.next(message);
  }
}
