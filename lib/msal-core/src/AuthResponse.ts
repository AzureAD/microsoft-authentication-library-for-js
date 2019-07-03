// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Account } from "./Account";
import { IdToken } from "./IdToken";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type AuthResponse = {
    uniqueId: string;
    tenantId: string;
    tokenType: string;
    idToken: IdToken;
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
        accessToken: "",
        scopes: null,
        expiresOn: null,
        account: null,
        accountState: state
    };
}

export function setResponseIdToken(originalResponse: AuthResponse, idToken: IdToken) : AuthResponse {
  var response = { ...originalResponse };
  response.idToken = idToken;
  if (response.idToken.objectId) {
    response.uniqueId = response.idToken.objectId;
  } else {
    response.uniqueId = response.idToken.subject;
  }
  response.tenantId = response.idToken.tenantId;
  return response;
}
