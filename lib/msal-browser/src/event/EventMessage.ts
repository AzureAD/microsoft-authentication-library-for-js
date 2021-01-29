/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, AuthError, CommonEndSessionRequest } from "@azure/msal-common";
import { EventType } from "./EventType";
import { InteractionType } from "../utils/BrowserConstants";
import { PopupRequest, RedirectRequest, SilentRequest, SsoSilentRequest } from "..";

export type EventMessage = {
    eventType: EventType;
    interactionType: InteractionType | null;
    payload: EventPayload;
    error: EventError;
    timestamp: number;
};

export type EventPayload = PopupRequest | RedirectRequest | SilentRequest | SsoSilentRequest | CommonEndSessionRequest | AuthenticationResult | null;

export type EventError = AuthError | Error | null;

export type EventCallbackFunction = (message: EventMessage) => void;
