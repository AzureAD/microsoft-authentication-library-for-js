/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type CcsCredential = { /* store ccs credential*/
    credential: string,
    type: CcsCredentialType
};

export enum CcsCredentialType {
    HOME_ACCOUNT_ID = "home_account_id", /* home account id*/
    UPN = "UPN" /* upn here*/
}
