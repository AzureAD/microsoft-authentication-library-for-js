/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Inject, Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { MSAL_INSTANCE } from "./constants";
import { EventMessage, EventMessageUtils, IPublicClientApplication, InteractionStatus } from "@azure/msal-browser";

@Injectable()
export class MsalBroadcastService {
    private _msalSubject: Subject<EventMessage>;
    public msalSubject$: Observable<EventMessage>;
    private _inProgress: Subject<InteractionStatus>;
    public inProgress$: Observable<InteractionStatus>;

    constructor(
        @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication
    ) {
        this._msalSubject = new Subject<EventMessage>();
        this.msalSubject$  = this._msalSubject.asObservable();
        this._inProgress = new Subject<InteractionStatus>();
        this.inProgress$ = this._inProgress.asObservable();
        this.msalInstance.addEventCallback((message: EventMessage) => {
            this._msalSubject.next(message);
            const status = EventMessageUtils.getInteractionStatusFromEvent(message);
            if (status !== null) {
                this.msalInstance.getLogger().verbose(`BroadcastService - ${message.eventType} results in setting inProgress to ${status}`);
                this._inProgress.next(status);
            }
        });
    }
}
