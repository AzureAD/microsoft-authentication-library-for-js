/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Inject, Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { MSAL_INSTANCE, InteractionStatus } from "./constants";
import { EventMessage, EventType, InteractionType, IPublicClientApplication } from "@azure/msal-browser";

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
            switch (message.eventType) {
                case EventType.LOGIN_START:
                    this.msalInstance.getLogger().verbose("BroadcastService - Login called, setting inProgress to 'login'");
                    this._inProgress.next(InteractionStatus.Login);
                    break;
                case EventType.SSO_SILENT_START:
                    this.msalInstance.getLogger().verbose("BroadcastService - SsoSilent called, setting inProgress to 'ssoSilent'");
                    this._inProgress.next(InteractionStatus.SsoSilent);
                    break;
                case EventType.ACQUIRE_TOKEN_START:
                    this.msalInstance.getLogger().verbose("BroadcastService - Interactive acquireToken called, setting inProgress to 'acquireToken'");
                    if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                        this._inProgress.next(InteractionStatus.AcquireToken)
                    }
                    break;
                case EventType.HANDLE_REDIRECT_START:
                    this.msalInstance.getLogger().verbose("BroadcastService - HandleRedirectPromise called, setting inProgress to 'handleRedirect'");
                    this._inProgress.next(InteractionStatus.HandleRedirect);
                    break;
                case EventType.LOGOUT_START:
                    this.msalInstance.getLogger().verbose("BroadcastService - Logout called, setting inProgress to 'logout'");
                    this._inProgress.next(InteractionStatus.Logout);
                    break;
                case EventType.LOGIN_SUCCESS:
                case EventType.SSO_SILENT_SUCCESS:
                case EventType.HANDLE_REDIRECT_END:
                case EventType.LOGIN_FAILURE:
                case EventType.SSO_SILENT_FAILURE:
                case EventType.LOGOUT_FAILURE:
                    this.msalInstance.getLogger().verbose("BroadcastService - Interactive request finished, setting inProgress to 'none'");
                    this._inProgress.next(InteractionStatus.None);
                    break;
                case EventType.ACQUIRE_TOKEN_SUCCESS:
                case EventType.ACQUIRE_TOKEN_FAILURE:
                    this.msalInstance.getLogger().verbose("BroadcastService - Interactive acquireToken request finished, setting inProgress to 'none'");
                    if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                        this._inProgress.next(InteractionStatus.None);
                    }
                    break;
            }
        });
    }
}
