import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { MSALError } from './MSALError';
import { AuthenticationResult } from './AuthenticationResult';
export declare type MessageCallback<T> = (payload: T) => void;
declare type BroadcastMessageSuccessType = 'msal:acquireTokenSuccess' | 'msal:loginSuccess';
declare type BroadcastMessageFailureType = 'msal:acquireTokenFailure' | 'msal:loginFailure' | 'msal:notAuthorized' | 'msal:stateMismatch';
interface BroadcastMessage<T, K> {
    type: T;
    payload: K;
}
interface BroadcastMessageSuccess extends BroadcastMessage<BroadcastMessageSuccessType, AuthenticationResult> {
}
interface BroadcastMessageFailure extends BroadcastMessage<BroadcastMessageFailureType, MSALError> {
}
export declare class BroadcastService {
    private _msalSubject;
    private msalItem$;
    constructor();
    broadcast(type: BroadcastMessageSuccessType, payload: AuthenticationResult): void;
    broadcast(type: BroadcastMessageFailureType, payload: MSALError): void;
    getMSALSubject(): BehaviorSubject<BroadcastMessageSuccess | BroadcastMessageFailure>;
    getMSALItem(): Observable<BroadcastMessageSuccess | BroadcastMessageFailure>;
    subscribe(type: BroadcastMessageSuccessType, callback: MessageCallback<AuthenticationResult>): Subscription;
    subscribe(type: BroadcastMessageFailureType, callback: MessageCallback<MSALError>): Subscription;
}
export {};
