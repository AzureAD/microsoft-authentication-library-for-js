import { CacheLocation } from "../Configuration";

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * Constants
 */
export class Constants {
    static get claims(): string { return "claims"; }
    static get clientId(): string { return "clientId"; }

    static get adalIdToken(): string { return "adal.idtoken"; }
    static get cachePrefix(): string { return "msal"; }
    static get scopes(): string { return "scopes"; }

    static get no_account(): string { return "NO_ACCOUNT"; }
    static get consumersUtid(): string { return "9188040d-6c67-4c5b-b112-36a304b66dad"; }
    static get upn(): string { return "upn"; }

    static get prompt_select_account(): string { return "&prompt=select_account"; }
    static get prompt_none(): string { return "&prompt=none"; }
    static get prompt(): string { return "prompt"; }

    static get response_mode_fragment(): string { return "&response_mode=fragment"; }
    static get resourceDelimiter(): string { return "|"; }
    static get cacheDelimiter(): string { return "."; }

    private static _popUpWidth: number = 483;
    static get popUpWidth(): number { return this._popUpWidth; }
    static set popUpWidth(width: number) {
        this._popUpWidth = width;
    }
    private static _popUpHeight: number = 600;
    static get popUpHeight(): number { return this._popUpHeight; }
    static set popUpHeight(height: number) {
        this._popUpHeight = height;
    }

    static get login(): string { return "LOGIN"; }
    static get renewToken(): string { return "RENEW_TOKEN"; }
    static get unknown(): string { return "UNKNOWN"; }

    static get homeAccountIdentifier(): string { return "homeAccountIdentifier"; }

    static get common(): string { return "common"; }
    static get openidScope(): string { return "openid"; }
    static get profileScope(): string { return "profile"; }

    static get interactionTypeRedirect(): InteractionType { return "redirectInteraction"; }
    static get interactionTypePopup(): InteractionType { return "popupInteraction"; }
}

/**
 * Status of the current token request
 */
export enum RequestStatus {
    CANCELLED = "Cancelled",
    COMPLETED = "Completed",
    IN_PROGRESS = "InProgress"
};

/**
 * Keys in the hashParams
 */
export enum ServerHashParamKeys {
    SCOPE = "scope",
    ERROR = "error",
    ERROR_DESCRIPTION = "error_description",
    ACCESS_TOKEN = "access_token",
    ID_TOKEN = "id_token",
    EXPIRES_IN = "expires_in",
    SESSION_STATE = "session_state",
    CLIENT_INFO = "client_info"
};

/**
 * @hidden
 * CacheKeys for MSAL
 */
export enum TemporaryCacheKeys {
    AUTHORITY = "authority",
    ACQUIRE_TOKEN_ACCOUNT = "acquireTokenAccount",
    SESSION_STATE = "session.state",
    STATE_LOGIN = "state.login",
    STATE_ACQ_TOKEN = "state.acquireToken",
    STATE_RENEW = "state.renew",
    NONCE_IDTOKEN = "nonce.idtoken",
    LOGIN_REQUEST = "login.request",
    RENEW_STATUS = "token.renew.status",
    URL_HASH = "urlHash",
    ANGULAR_LOGIN_REQUEST = "angular.login.request",
    INTERACTION_STATUS = "interaction.status"
}

export enum PersistentCacheKeys {
    IDTOKEN = "idtoken",
    CLIENT_INFO = "client.info",
    ADAL_ID_TOKEN = "adal.idtoken",
    ERROR = "error",
    ERROR_DESC = "error.description",
    LOGIN_ERROR = "login.error"
}

export const AADTrustedHostList =  {
    "login.windows.net": "login.windows.net",
    "login.chinacloudapi.cn": "login.chinacloudapi.cn",
    "login.cloudgovapi.us": "login.cloudgovapi.us",
    "login.microsoftonline.com": "login.microsoftonline.com",
    "login.microsoftonline.de": "login.microsoftonline.de",
    "login.microsoftonline.us": "login.microsoftonline.us"
};

/**
 * @hidden
 * SSO Types - generated to populate hints
 */
export enum SSOTypes {
    ACCOUNT = "account",
    SID = "sid",
    LOGIN_HINT = "login_hint",
    ID_TOKEN ="id_token",
    DOMAIN_HINT = "domain_hint",
    ORGANIZATIONS = "organizations",
    CONSUMERS = "consumers",
    ACCOUNT_ID = "accountIdentifier",
    HOMEACCOUNT_ID = "homeAccountIdentifier",
    LOGIN_REQ = "login_req",
    DOMAIN_REQ = "domain_req"
};

/**
 * @hidden
 */
export const BlacklistedEQParams = [
    SSOTypes.SID,
    SSOTypes.LOGIN_HINT
];

export type InteractionType = "redirectInteraction" | "popupInteraction";

/**
 * we considered making this "enum" in the request instead of string, however it looks like the allowed list of
 * prompt values kept changing over past couple of years. There are some undocumented prompt values for some
 * internal partners too, hence the choice of generic "string" type instead of the "enum"
 * @hidden
 */
export const PromptState = {
    LOGIN: "login",
    SELECT_ACCOUNT: "select_account",
    CONSENT: "consent",
    NONE: "none",
};

/**
 * MSAL JS Library Version
 */
export function libraryVersion(): string {
    return "1.2.0-beta.3";
}
