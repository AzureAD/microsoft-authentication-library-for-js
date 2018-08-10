import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
export declare type MessageCallback = (payload: any) => void;
export declare class BroadcastService {
    private _msalSubject;
    private msalItem$;
    constructor();
    broadcast(type: string, payload: any): void;
    getMSALSubject(): BehaviorSubject<any>;
    getMSALItem(): Observable<any>;
    subscribe(type: string, callback: MessageCallback): Subscription;
}
