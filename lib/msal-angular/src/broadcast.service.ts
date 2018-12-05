import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/map'
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import { MSALError } from './MSALError';
import { AuthenticationResult } from './AuthenticationResult';
// export type MessageCallback = (payload: any) => void;
export type MessageCallback<T> = (payload: T) => void;

type BroadcastMessageSuccessType = 'msal:acquireTokenSuccess' | 'msal:loginSuccess';
type BroadcastMessageFailureType = 'msal:acquireTokenFailure' | 'msal:loginFailure' | 'msal:notAuthorized' | 'msal:stateMismatch';

interface BroadcastMessage<T, K> {
    type: T,
    payload: K
}

interface BroadcastMessageSuccess extends BroadcastMessage<BroadcastMessageSuccessType, AuthenticationResult> {}
interface BroadcastMessageFailure extends BroadcastMessage<BroadcastMessageFailureType, MSALError> {}


@Injectable()
export class BroadcastService {
    private _msalSubject : BehaviorSubject<BroadcastMessageSuccess | BroadcastMessageFailure> ;
    private msalItem$:  Observable<BroadcastMessageSuccess | BroadcastMessageFailure>;

    constructor()
    {
     this._msalSubject = new BehaviorSubject<any>(1);

     this.msalItem$  = this._msalSubject.asObservable();
    }

    broadcast(type: BroadcastMessageSuccessType, payload: AuthenticationResult): void;
    broadcast(type: BroadcastMessageFailureType, payload: MSALError): void;

    broadcast(type: any, payload: any) {
        this._msalSubject.next({type , payload});
    }

    getMSALSubject()
    {
        return this._msalSubject;
    }

    getMSALItem()
    {
        return this.msalItem$;
    }

    subscribe(type: BroadcastMessageSuccessType, callback: MessageCallback<AuthenticationResult>): Subscription;
    subscribe(type: BroadcastMessageFailureType, callback: MessageCallback<MSALError>): Subscription;

    subscribe(type: any, callback: any): Subscription {
        return this.msalItem$
         .filter(message => message.type === type)
           .map(message => message.payload)
            .subscribe(callback);
    }

}
