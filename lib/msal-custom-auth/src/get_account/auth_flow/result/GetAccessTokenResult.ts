/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { GetCurrentAccountAccessTokenError } from "../error_type/GetAccountError.js";
import { GetAccessTokenCompletedState } from "../state/GetAccessTokenCompletedState.js";
import { GetAccessTokenFailedState } from "../state/GetAccessTokenFailedState.js";

/*
 * Result of getting an access token.
 */
export class GetAccessTokenResult extends AuthFlowResultBase<
    GetAccessTokenResultState,
    GetCurrentAccountAccessTokenError,
    AuthenticationResult
> {
    constructor(resultData?: AuthenticationResult) {
        super(new GetAccessTokenCompletedState(), resultData);
    }

    static createWithError(error: unknown): GetAccessTokenResult {
        const result = new GetAccessTokenResult();
        result.error = new GetCurrentAccountAccessTokenError(GetAccessTokenResult.createErrorData(error));
        result.state = new GetAccessTokenFailedState();

        return result;
    }
}

export type GetAccessTokenResultState = GetAccessTokenCompletedState | GetAccessTokenFailedState;
