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
        homeAccountId: "homeAccountId",
        environment: "login.microsoftonline.com",
        tenantId: "tenantId",
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
            "2995ae49-d9dd-409d-8d62-ba969ce58a81.51178b70-16cc-41b5-bef1-ae1808139065",
        idTokenClaims: {
            aud: "a076930c-cfc9-4ebd-9607-7963bccbf666",
            exp: "1680557128",
            graph_url: "https://graph.microsoft.com",
            iat: "1680553228",
            iss: "https://login.microsoftonline.com/51178b70-16cc-41b5-bef1-ae1808139065/v2.0",
            name: "Adele Vance",
            nbf: "1680553228",
            oid: "2995ae49-d9dd-409d-8d62-ba969ce58a81",
            preferred_username: "AdeleV@vc6w6.onmicrosoft.com",
            rh: "0.AX0AcIsXUcwWtUG-8a4YCBOQZQyTdqDJz71Olgd5Y7zL9maaAHs.",
            sovereignty2: "Global",
            sub: "wtxUI1WD2C--Bl8vN1p-P-VgadGud8QSqXD4Vp5i9sc",
            tid: "51178b70-16cc-41b5-bef1-ae1808139065",
            uti: "39pEKQyYDU6SXjD_phaCAA",
            ver: "2.0",
        },
        localAccountId: "2995ae49-d9dd-409d-8d62-ba969ce58a81",
        name: "Adele Vance",
        tenantId: "51178b70-16cc-41b5-bef1-ae1808139065",
        username: "AdeleV@vc6w6.onmicrosoft.com",
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
        aud: "a076930c-cfc9-4ebd-9607-7963bccbf666",
        exp: "1680557128",
        graph_url: "https://graph.microsoft.com",
        iat: "1680553228",
        iss: "https://login.microsoftonline.com/51178b70-16cc-41b5-bef1-ae1808139065/v2.0",
        name: "Adele Vance",
        nbf: "1680553228",
        oid: "2995ae49-d9dd-409d-8d62-ba969ce58a81",
        preferred_username: "AdeleV@vc6w6.onmicrosoft.com",
        rh: "0.AX0AcIsXUcwWtUG-8a4YCBOQZQyTdqDJz71Olgd5Y7zL9maaAHs.",
        sovereignty2: "Global",
        sub: "wtxUI1WD2C--Bl8vN1p-P-VgadGud8QSqXD4Vp5i9sc",
        tid: "51178b70-16cc-41b5-bef1-ae1808139065",
        uti: "39pEKQyYDU6SXjD_phaCAA",
        ver: "2.0",
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
