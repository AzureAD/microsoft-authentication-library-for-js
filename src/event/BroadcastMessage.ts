import { AuthenticationResult, AuthError, EndSessionRequest } from "@azure/msal-common";
import { BroadcastEvent } from "./BroadcastEvent";
import { InteractionType } from "../utils/BrowserConstants";
import { PopupRequest, RedirectRequest, SilentRequest, SsoSilentRequest } from "..";

export type BroadcastMessage = {
    eventType: BroadcastEvent;
    interactionType: InteractionType | null;
    payload: BroadcastPayload;
    error: BroadcastError;
    timestamp: number;
};

export type BroadcastPayload = PopupRequest | RedirectRequest | SilentRequest | SsoSilentRequest | EndSessionRequest | AuthenticationResult | null;

export type BroadcastError = AuthError | Error | null;
