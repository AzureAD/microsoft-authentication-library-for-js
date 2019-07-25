// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Account } from "./Account";
import { IdToken } from "./IdToken";
import { StringDict } from "./MsalTypes";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type AuthResponse = {
    uniqueId: string;
    tenantId: string;
    tokenType: string;
    idToken: IdToken;
    idTokenClaims: StringDict;
    accessToken: string;
    scopes: Array<string>;
    expiresOn: Date;
    account: Account;
    accountState: string;
};

export function buildResponseStateOnly(state: string) : AuthResponse {
    return {
        uniqueId: "",
        tenantId: "",
        tokenType: "",
        idToken: null,
        idTokenClaims: null,
        accessToken: "",
        scopes: null,
        expiresOn: null,
        account: null,
        accountState: state
    };
}

export function setResponseIdToken(originalResponse: AuthResponse, idTokenObj: IdToken) : AuthResponse {
    let exp = Number(idTokenObj.expiration);
    if (exp && !originalResponse.expiresOn) {
        originalResponse.expiresOn = new Date(exp * 1000);
    }

    return {
      ...originalResponse,
      idToken: idTokenObj,
      idTokenClaims: idTokenObj.claims,
      uniqueId: idTokenObj.objectId || idTokenObj.subject,
      tenantId: idTokenObj.tenantId,
    };
}
