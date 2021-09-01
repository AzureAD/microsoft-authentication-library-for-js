/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { MSAL_INSTANCE } from "./constants";
import { EventMessage, EventMessageUtils, IPublicClientApplication, InteractionStatus, EventType } from "@azure/msal-browser";
import { MsalService } from "./msal.service";

@Injectable()
export class MsalBroadcastService {
    private _msalSubject: Subject<EventMessage>;
    public msalSubject$: Observable<EventMessage>;
    private _inProgress: BehaviorSubject<InteractionStatus>;
    public inProgress$: Observable<InteractionStatus>;

    constructor(
        @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication,
        private authService: MsalService
    ) {
        this._msalSubject = new Subject<EventMessage>();
        this.msalSubject$  = this._msalSubject.asObservable();

        // InProgress as BehaviorSubject so most recent inProgress state will be available upon subscription
        this._inProgress = new BehaviorSubject<InteractionStatus>(InteractionStatus.Startup);
        this.inProgress$ = this._inProgress.asObservable();

        this.msalInstance.addEventCallback((message: EventMessage) => {
            this._msalSubject.next(message);
            const status = EventMessageUtils.getInteractionStatusFromEvent(message);
            if (status !== null) {
                if (this._inProgress.value === InteractionStatus.HandleRedirect && status === InteractionStatus.None && message.eventType !== EventType.HANDLE_REDIRECT_END) {
                    this.authService.getLogger().verbose(`BroadcastService - ${message.eventType} - handleRedirectPromise is in progress. inProgress state will be set to 'None' when complete.`);
                } else if (message.eventType === EventType.HANDLE_REDIRECT_END && this._inProgress.value !== InteractionStatus.HandleRedirect) {
                    this.authService.getLogger().verbose(`BroadcastService - ${message.eventType} - handleRedirectPromise has finished but a different interaction is currently in progress. Can't set inProgress to 'None'`);
                } else {
                    this.authService.getLogger().verbose(`BroadcastService - ${message.eventType} results in setting inProgress from ${this._inProgress.value} to ${status}`);
                    this._inProgress.next(status);
                }
            }
        });
    }
}
