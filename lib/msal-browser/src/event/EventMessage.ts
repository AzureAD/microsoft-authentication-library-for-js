/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, AuthError, AccountInfo } from "@azure/msal-common";
import { EventType } from "./EventType";
import { InteractionStatus, InteractionType } from "../utils/BrowserConstants";
import { PopupRequest, RedirectRequest, SilentRequest, SsoSilentRequest, EndSessionRequest } from "..";

type EventMessageWrapper<TEvent extends EventType, TInteraction extends InteractionType | null, TPayload extends EventPayload, TError extends EventError> = {
    eventType: TEvent;
    interactionType: TInteraction;
    payload: TPayload;
    error: TError;
    timestamp: number;
};

export type EventMessage =
| EventMessageWrapper<EventType.LOGIN_START, InteractionType.Popup | InteractionType.Redirect, PopupRequest | RedirectRequest, null>
| EventMessageWrapper<EventType.LOGIN_SUCCESS,InteractionType.Popup | InteractionType.Redirect, AuthenticationResult, null>
| EventMessageWrapper<EventType.LOGIN_FAILURE, InteractionType.Popup | InteractionType.Redirect, null, AuthError | Error>
| EventMessageWrapper<EventType.ACQUIRE_TOKEN_START, InteractionType.Popup | InteractionType.Redirect | InteractionType.Silent, PopupRequest | RedirectRequest | SilentRequest, null>
| EventMessageWrapper<EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Popup | InteractionType.Redirect | InteractionType.Silent, AuthenticationResult, null>
| EventMessageWrapper<EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Popup | InteractionType.Redirect | InteractionType.Silent, null, AuthError | Error>
| EventMessageWrapper<EventType.ACQUIRE_TOKEN_NETWORK_START, InteractionType.Silent, null, null>
| EventMessageWrapper<EventType.SSO_SILENT_START, InteractionType.Silent, SsoSilentRequest, null>
| EventMessageWrapper<EventType.SSO_SILENT_SUCCESS, InteractionType.Silent, AuthenticationResult, null>
| EventMessageWrapper<EventType.SSO_SILENT_FAILURE, InteractionType.Silent, null, AuthError | Error>
| EventMessageWrapper<EventType.HANDLE_REDIRECT_START, InteractionType.Redirect, null, null>
| EventMessageWrapper<EventType.HANDLE_REDIRECT_END, InteractionType.Redirect, null, null>
| EventMessageWrapper<EventType.LOGOUT_START, InteractionType.Redirect | InteractionType.Popup, EndSessionRequest, null>
| EventMessageWrapper<EventType.LOGOUT_END, InteractionType.Redirect | InteractionType.Popup, null, null>
| EventMessageWrapper<EventType.LOGOUT_SUCCESS, InteractionType.Redirect | InteractionType.Popup, EndSessionRequest, null>
| EventMessageWrapper<EventType.LOGIN_FAILURE, InteractionType.Redirect | InteractionType.Popup, null, AuthError | Error>
| EventMessageWrapper<EventType.ACCOUNT_ADDED, null, AccountInfo, null>
| EventMessageWrapper<EventType.ACCOUNT_REMOVED, null, AccountInfo, null>;

export type PopupEvent = {
    popupWindow: Window;
};

export type EventPayload = AccountInfo | PopupRequest | RedirectRequest | SilentRequest | SsoSilentRequest | EndSessionRequest | AuthenticationResult | PopupEvent | null;

export type EventError = AuthError | Error | null;

export type EventCallbackFunction = (message: EventMessage) => void;

export class EventMessageUtils {

    /**
     * Gets interaction status from event message
     * @param message
     * @param currentStatus
     */
    static getInteractionStatusFromEvent(message: EventMessage, currentStatus?: InteractionStatus): InteractionStatus|null {
        switch (message.eventType) {
            case EventType.LOGIN_START:
                return InteractionStatus.Login;
            case EventType.SSO_SILENT_START:
                return InteractionStatus.SsoSilent;
            case EventType.ACQUIRE_TOKEN_START:
                if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                    return InteractionStatus.AcquireToken;
                }
                break;
            case EventType.HANDLE_REDIRECT_START:
                return InteractionStatus.HandleRedirect;
            case EventType.LOGOUT_START:
                return InteractionStatus.Logout;
            case EventType.SSO_SILENT_SUCCESS:
            case EventType.SSO_SILENT_FAILURE:
                if (currentStatus && currentStatus !== InteractionStatus.SsoSilent) {
                    // Prevent this event from clearing any status other than ssoSilent
                    break;
                }
                return InteractionStatus.None;
            case EventType.LOGOUT_END:
                if (currentStatus && currentStatus !== InteractionStatus.Logout) {
                    // Prevent this event from clearing any status other than logout
                    break;
                }
                return InteractionStatus.None;
            case EventType.HANDLE_REDIRECT_END:
                if (currentStatus && currentStatus !== InteractionStatus.HandleRedirect) {
                    // Prevent this event from clearing any status other than handleRedirect
                    break;
                }
                return InteractionStatus.None;
            case EventType.LOGIN_SUCCESS:
            case EventType.LOGIN_FAILURE:
            case EventType.ACQUIRE_TOKEN_SUCCESS:
            case EventType.ACQUIRE_TOKEN_FAILURE:
                if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                    if (currentStatus && currentStatus !== InteractionStatus.Login && currentStatus !== InteractionStatus.AcquireToken) {
                        // Prevent this event from clearing any status other than login or acquireToken
                        break;
                    }
                    return InteractionStatus.None;
                }
                break;
            default:
                break;
        }
        return null;
    }
}
