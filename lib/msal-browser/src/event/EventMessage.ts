/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, AuthError, EndSessionRequest } from "@azure/msal-common";
import { EventType } from "./EventType";
import { InteractionStatus, InteractionType } from "../utils/BrowserConstants";
import { PopupRequest, RedirectRequest, SilentRequest, SsoSilentRequest } from "..";

export type EventMessage = {
    eventType: EventType;
    interactionType: InteractionType | null;
    payload: EventPayload;
    error: EventError;
    timestamp: number;
};

export type EventPayload = PopupRequest | RedirectRequest | SilentRequest | SsoSilentRequest | EndSessionRequest | AuthenticationResult | null;

export type EventError = AuthError | Error | null;

export type EventCallbackFunction = (message: EventMessage) => void;

export class EventMessageUtils {

    /**
     * Gets interaction status from event message
     * @param message 
     */
    static getInteractionStatusFromEvent(message: EventMessage): InteractionStatus|null {
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
            case EventType.LOGIN_SUCCESS:
            case EventType.SSO_SILENT_SUCCESS:
            case EventType.HANDLE_REDIRECT_END:
            case EventType.LOGIN_FAILURE:
            case EventType.SSO_SILENT_FAILURE:
            case EventType.LOGOUT_FAILURE:
                return InteractionStatus.None;
            case EventType.ACQUIRE_TOKEN_SUCCESS:
            case EventType.ACQUIRE_TOKEN_FAILURE:
                if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                    return InteractionStatus.None;
                }
                break;
            default:
                break;
        }
        return null;
    }
}
