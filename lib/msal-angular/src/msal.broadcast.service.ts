/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Inject, Injectable, Optional } from "@angular/core";
import { BehaviorSubject, Observable, ReplaySubject, Subject } from "rxjs";
import { MSAL_BROADCAST_CONFIG, MSAL_INSTANCE } from "./constants";
import { EventMessage, EventMessageUtils, IPublicClientApplication, InteractionStatus } from "@azure/msal-browser";
import { MsalService } from "./msal.service";
import { MsalBroadcastConfiguration } from "./msal.broadcast.config";

@Injectable()
export class MsalBroadcastService {
    private _msalSubject: Subject<EventMessage>;
    public msalSubject$: Observable<EventMessage>;
    private _inProgress: BehaviorSubject<InteractionStatus>;
    public inProgress$: Observable<InteractionStatus>;

    constructor(
        @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication,
        private authService: MsalService,
        @Optional() @Inject(MSAL_BROADCAST_CONFIG) private msalBroadcastConfig?: MsalBroadcastConfiguration
    ) {
        // Make _msalSubject a ReplaySubject if configured to replay past events
        if (this.msalBroadcastConfig && this.msalBroadcastConfig.eventsToReplay > 0) {
            this.authService.getLogger().verbose(`BroadcastService - replayPastEvents set on BroadcastConfig, replaying the last ${this.msalBroadcastConfig.eventsToReplay} events`);
            this._msalSubject = new ReplaySubject<EventMessage>(this.msalBroadcastConfig.eventsToReplay);
        } else {
            // Defaults to _msalSubject being a Subject
            this._msalSubject = new Subject<EventMessage>();
        }

        this.msalSubject$  = this._msalSubject.asObservable();

        // InProgress as BehaviorSubject so most recent inProgress state will be available upon subscription
        this._inProgress = new BehaviorSubject<InteractionStatus>(InteractionStatus.Startup);
        this.inProgress$ = this._inProgress.asObservable();

        this.msalInstance.addEventCallback((message: EventMessage) => {
            this._msalSubject.next(message);
            const status = EventMessageUtils.getInteractionStatusFromEvent(message, this._inProgress.value);
            if (status !== null) {
                this.authService.getLogger().verbose(`BroadcastService - ${message.eventType} results in setting inProgress from ${this._inProgress.value} to ${status}`);
                this._inProgress.next(status);
            }
        });
    }
}
