/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Inject, Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { MSAL_INSTANCE } from "./constants";
import { EventMessage, IPublicClientApplication } from "@azure/msal-browser";

@Injectable()
export class MsalBroadcastService {
    private _msalSubject: Subject<EventMessage>;
    public msalSubject$: Observable<EventMessage>;

    constructor(
        @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication
    ) {
        this._msalSubject = new Subject<EventMessage>();
        this.msalSubject$  = this._msalSubject.asObservable();
        this.msalInstance.addEventCallback((message: EventMessage) => {
            this._msalSubject.next(message);
        });
    }
}
