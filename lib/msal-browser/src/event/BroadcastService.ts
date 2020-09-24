import { Observable, Subject } from "rxjs";
import { AuthenticationResult, AuthError } from "@azure/msal-common";
import { BroadcastEvent } from "./EventConstants";

export interface BroadcastMessage {
    type: BroadcastEvent;
    payload: AuthenticationResult | AuthError | null;
}

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
