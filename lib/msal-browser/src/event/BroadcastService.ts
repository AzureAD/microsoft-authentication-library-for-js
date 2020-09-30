import { Observable, Subject } from "rxjs";
import { AuthenticationResult, AuthError } from "@azure/msal-common";
import { BroadcastEvent } from "./EventConstants";
import { InteractionType } from "../utils/BrowserConstants";

export interface BroadcastMessage {
    type: BroadcastEvent;
    payload: AuthenticationResult | AuthError | null;
}

/**
 * Broadcast service using rxjs observables
 */
export class BroadcastService {
    private _msalSubject: Subject<any>;
    public msalSubject$: Observable<any>;

    constructor() {
        this._msalSubject = new Subject<BroadcastMessage>();
        this.msalSubject$  = this._msalSubject.asObservable();
    }

    broadcast(type: BroadcastEvent, payload: AuthenticationResult | AuthError) {
        this._msalSubject.next({type , payload});
    }
}

/**
 * Object indicating interaction type of event started
 */
export class EventStartObject {
    public interactionType: InteractionType;

    constructor(interactionType: InteractionType) {
        this.interactionType = interactionType;
    }
}
