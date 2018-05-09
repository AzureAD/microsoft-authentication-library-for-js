import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/map'
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
export type MessageCallback = (payload: any) => void;

@Injectable()
export class BroadcastService {
    private _navItemSubject : BehaviorSubject<any> ;
    private navItem$:  Observable<any>;

    constructor()
    {
     this._navItemSubject = new BehaviorSubject<any>(100);
     this.navItem$  = this._navItemSubject.asObservable();
    }

    broadcast(type: string ,payload: any) {
        this._navItemSubject.next({type , payload});
    }

    getNavItem()
    {
        return this.navItem$;
    }

    subscribe(type: string, callback: MessageCallback): Subscription {
        return this.navItem$
         .filter(message => message.type === type)
           .map(message => message.payload)
            .subscribe(callback);
    }

}
