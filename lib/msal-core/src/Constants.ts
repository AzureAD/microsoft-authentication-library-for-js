import { CacheLocation } from "./Configuration";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @hidden
 */
export class Constants {
  static get errorDescription(): string { return "error_description"; }
  static get error(): string { return "error"; }

  static get scope(): string { return "scope"; }
  static get clientInfo(): string { return "client_info"; }
  static get clientId(): string { return "clientId"; }

  static get idToken(): string { return "id_token"; }
  static get adalIdToken(): string { return "adal.idtoken"; }
  static get accessToken(): string { return "access_token"; }
  static get expiresIn(): string { return "expires_in"; }
  static get sessionState(): string { return "session_state"; }
  static get claims(): string { return "claims"; }

  static get msalClientInfo(): string { return "msal.client.info"; }
  static get msalError(): string { return "msal.error"; }
  static get msalErrorDescription(): string { return "msal.error.description"; }

  static get msalSessionState(): string { return "msal.session.state"; }
  static get tokenKeys(): string { return "msal.token.keys"; }
  static get accessTokenKey(): string { return "msal.access.token.key"; }
  static get expirationKey(): string { return "msal.expiration.key"; }
  static get stateLogin(): string { return "msal.state.login"; }
  static get stateAcquireToken(): string { return "msal.state.acquireToken"; }
  static get stateRenew(): string { return "msal.state.renew"; }
  static get nonceIdToken(): string { return "msal.nonce.idtoken"; }
  static get userName(): string { return "msal.username"; }
  static get idTokenKey(): string { return "msal.idtoken"; }
  static get loginRequest(): string { return "msal.login.request"; }
  static get loginError(): string { return "msal.login.error"; }
  static get renewStatus(): string { return "msal.token.renew.status"; }
  static get urlHash(): string { return "msal.urlHash"; }
  static get angularLoginRequest(): string { return "msal.angular.login.request"; }
  static get msal(): string { return "msal"; }

  static get no_account(): string { return "NO_ACCOUNT"; }
  static get consumersUtid(): string { return "9188040d-6c67-4c5b-b112-36a304b66dad"; }
  static get upn(): string { return "upn"; }

  static get prompt_select_account(): string { return "&prompt=select_account"; }
  static get prompt_none(): string { return "&prompt=none"; }
  static get prompt(): string { return "prompt"; }

  static get response_mode_fragment(): string { return "&response_mode=fragment"; }
  static get resourceDelimiter(): string { return "|"; }

  static get tokenRenewStatusCancelled(): string { return "Canceled"; }
  static get tokenRenewStatusCompleted(): string { return "Completed"; }
  static get tokenRenewStatusInProgress(): string { return "In Progress"; }

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

  static get cacheLocationLocal(): CacheLocation { return "localStorage"; }
  static get cacheLocationSession(): CacheLocation { return "sessionStorage"; }
}

/**
 * @hidden
 */
export const CacheKeys = {
    AUTHORITY: "msal.authority",
    ACQUIRE_TOKEN_ACCOUNT: "msal.acquireTokenAccount"
};

/**
 * @hidden
 */
export const SSOTypes = {
    ACCOUNT: "account",
    SID: "sid",
    LOGIN_HINT: "login_hint",
    ID_TOKEN: "id_token",
    DOMAIN_HINT: "domain_hint",
    ORGANIZATIONS: "organizations",
    CONSUMERS: "consumers",
    ACCOUNT_ID: "accountIdentifier",
    HOMEACCOUNT_ID: "homeAccountIdentifier",
    LOGIN_REQ: "login_req",
    DOMAIN_REQ: "domain_req"
};

export const BlacklistedEQParams = [
  SSOTypes.SID,
  SSOTypes.LOGIN_HINT
];

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

export const Library = {
  version: "1.0.2"
};
