/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";
import { GetAccessTokenState } from "../../../core/auth_flow/AuthFlowState.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { GetAccessTokenError } from "../error_type/GetAccountError.js";

/*
 * Result of getting an access token.
 */
export class GetAccessTokenResult extends AuthFlowResultBase<
    GetAccessTokenState,
    GetAccessTokenError,
    AuthenticationResult
> {
    constructor(resultData?: AuthenticationResult) {
        super(resultData);
    }

    get state(): GetAccessTokenState {
        if (!!this.error) {
            return GetAccessTokenState.Failed;
        }

        if (!!this.data) {
            return GetAccessTokenState.Completed;
        }

        return GetAccessTokenState.Unknown;
    }
}
