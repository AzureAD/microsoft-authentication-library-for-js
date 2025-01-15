/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PopupRequest, RedirectRequest } from "../../src/index.js";
import { AccountInfo } from "../../src/naa/AccountInfo.js";
import { AuthResult } from "../../src/naa/AuthResult.js";
import { BridgeError } from "../../src/naa/BridgeError.js";
import { BridgeStatusCode } from "../../src/naa/BridgeStatusCode.js";
import { InitContext } from "../../src/naa/InitContext.js";

import { TokenRequest } from "../../src/naa/TokenRequest.js";
import { TEST_TOKENS } from "../utils/StringConstants.js";

export const NAA_CLIENT_ID: string = "clientid";
export const NAA_SCOPE: string = "User.Read";
export const NAA_CORRELATION_ID: string = "1234";
export const NAA_AUTHORITY: string = "https://login.microsoftonline.com/common";
export const NAA_CLIENT_CAPABILITIES: string[] = [];
export const INIT_CONTEXT_RESPONSE: InitContext = {
    sdkName: "test",
    sdkVersion: "1.0.0",
    capabilities: { queryAccount: false },
    accountContext: {
        homeAccountId:
            "00000000-0000-0000-66f3-3332eca7ea81.3338040d-6c67-4c5b-b112-36a304b66da",
        environment: "login.microsoftonline.com",
        tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
    },
};

export const POPUP_REQUEST: PopupRequest = {
    authority: NAA_AUTHORITY,
    scopes: [NAA_SCOPE],
    correlationId: NAA_CORRELATION_ID,
};

export const REDIRECT_REQUEST: RedirectRequest = {
    authority: NAA_AUTHORITY,
    scopes: [NAA_SCOPE],
    correlationId: NAA_CORRELATION_ID,
};

export const SILENT_TOKEN_RESPONSE: AuthResult = {
    token: {
        access_token: TEST_TOKENS.ACCESS_TOKEN,
        expires_in: 4290,
        id_token: TEST_TOKENS.IDTOKEN_V2,
        properties: null,
        scope: "User.Read",
    },
    account: {
        environment: "login.microsoftonline.com",
        homeAccountId:
            "00000000-0000-0000-66f3-3332eca7ea81.3338040d-6c67-4c5b-b112-36a304b66da",
        idTokenClaims: {
            ver: "2.0",
            iss: "https://login.microsoftonline.com/3338040d-6c67-4c5b-b112-36a304b66dad/v2.0",
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            aud: "6cb04018-a3f5-46a7-b995-940c78f5aef3",
            exp: 1536361411,
            iat: 1536274711,
            nbf: 1536274711,
            name: "Abe Lincoln",
            preferred_username: "AbeLi@microsoft.com",
            login_hint: "AbeLiLoginHint",
            upn: "AbeLiUpn",
            sid: "AbeLiSid",
            oid: "00000000-0000-0000-66f3-3332eca7ea81",
            tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
            nonce: "123523",
        },
        localAccountId: "00000000-0000-0000-66f3-3332eca7ea8",
        name: "Abe Lincoln",
        tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
        username: "AbeLi@microsoft.com",
    },
};

export const NAA_APP_CONSTANTS = {
    homeAccountId:
        "2995ae49-d9dd-409d-8d62-ba969ce58a81.51178b70-16cc-41b5-bef1-ae1808139065",
    localAccountId: "2995ae49-d9dd-409d-8d62-ba969ce58a81",
    environment: "login.microsoftonline.com",
    tenantId: "51178b70-16cc-41b5-bef1-ae1808139065",
    username: "AdeleV@vc6w6.onmicrosoft.com",
    idTokenClaims: {
        ver: "2.0",
        iss: "https://login.microsoftonline.com/3338040d-6c67-4c5b-b112-36a304b66dad/v2.0",
        sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
        aud: "6cb04018-a3f5-46a7-b995-940c78f5aef3",
        exp: 1536361411,
        iat: 1536274711,
        nbf: 1536274711,
        name: "Abe Lincoln",
        preferred_username: "AbeLi@microsoft.com",
        login_hint: "AbeLiLoginHint",
        upn: "AbeLiUpn",
        sid: "AbeLiSid",
        oid: "00000000-0000-0000-66f3-3332eca7ea81",
        tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
        nonce: "123523",
    },
};

export const SILENT_TOKEN_REQUEST: TokenRequest = {
    scope: "User.Read",
    clientId: NAA_CLIENT_ID,
    correlationId: NAA_CORRELATION_ID,
};

export const BRIDGE_ERROR_USER_INTERACTION_REQUIRED: BridgeError = {
    status: BridgeStatusCode.UserInteractionRequired,
    code: "interaction_required",
    subError: "",
    description:
        "User interaction is required to complete the authentication request",
    properties: {},
};

export const BRIDGE_ERROR_USER_CANCEL: BridgeError = {
    status: BridgeStatusCode.UserCancel,
    code: "",
    subError: "",
    description: "User cancelled the request",
    properties: {},
};

export const BRIDGE_ERROR_NOT_NETWORK: BridgeError = {
    status: BridgeStatusCode.NoNetwork,
    code: "",
    subError: "",
    description: "Network unavailable",
    properties: {},
};

export const BRIDGE_ERROR_TRANSIENT_ERROR_SERVER: BridgeError = {
    status: BridgeStatusCode.TransientError,
    code: "something",
    subError: "",
    description: "A transient server error?",
    properties: {},
};

export const BRIDGE_ERROR_TRANSIENT_ERROR_CLIENT: BridgeError = {
    status: BridgeStatusCode.TransientError,
    code: "",
    subError: "",
    description: "A transient client error? (Notice nothing in code/subError",
    properties: {},
};

export const BRIDGE_ERROR_PERSISTENT_ERROR_CLIENT: BridgeError = {
    status: BridgeStatusCode.PersistentError,
    code: "",
    subError: "",
    description: "A persistent client error? (Notice nothing in code/subError)",
    properties: {},
};

export const BRIDGE_ERROR_PERSISTENT_ERROR_SERVER: BridgeError = {
    status: BridgeStatusCode.PersistentError,
    code: "invalid_request",
    subError: "",
    description: "A persistent server error? (Notice nothing in code/subError)",
    properties: {},
};

// Not sure when we would get this
export const BRIDGE_ERROR_DISABLED: BridgeError = {
    status: BridgeStatusCode.Disabled,
    code: "",
    subError: "",
    description: "Something is disabled",
    properties: {},
};

/*
 * Assume we get this on a silent request where we specified an account
 * Or when we request account Info and it's not found
 */
export const BRIDGE_ERROR_ACCOUNT_UNAVAILABLE: BridgeError = {
    status: BridgeStatusCode.AccountUnavailable,
    code: "",
    subError: "",
    description: "Account unavailable",
    properties: {},
};

// Not sure when we get this
export const BRIDGE_ERROR_NAA_UNAVAILABLE: BridgeError = {
    status: BridgeStatusCode.NestedAppAuthUnavailable,
    code: "",
    subError: "",
    description: "Account unavailable",
    properties: {},
};

export const ACCOUNT_INFO_RESPONSE: AccountInfo = {
    homeAccountId: "A",
    environment: "login.microsoftonline.com",
    tenantId: "tenantid",
    username: "C",
    localAccountId: "B",
};
