import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export type MessageCallback = (payload: any) => void;

@Injectable()
export class BroadcastService {
    private _msalSubject : BehaviorSubject<any> ;
    private msalItem$:  Observable<any>;

    constructor()
    {
     this._msalSubject = new BehaviorSubject<any>(1);
     this.msalItem$  = this._msalSubject.asObservable();
    }

    broadcast(type: string ,payload: any) {
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

    subscribe(type: string, callback: MessageCallback): Subscription {
        return this.msalItem$
            .pipe(
                filter(message => message.type === type),
                map(message => message.payload)
            )
            .subscribe(callback);
    }

}
