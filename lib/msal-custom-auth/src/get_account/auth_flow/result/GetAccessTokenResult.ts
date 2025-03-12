/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { GetCurrentAccountAccessTokenError } from "../error_type/GetAccountError.js";
import { GetAccessTokenCompleted } from "../state/GetAccessTokenCompleted.js";
import { GetAccessTokenFailed } from "../state/GetAccessTokenFailed.js";

/*
 * Result of getting an access token.
 */
export class GetAccessTokenResult extends AuthFlowResultBase<
    GetAccessTokenCompleted | GetAccessTokenFailed,
    GetCurrentAccountAccessTokenError,
    AuthenticationResult
> {
    constructor(resultData?: AuthenticationResult) {
        super(new GetAccessTokenCompleted(), resultData);
    }

    static createWithError(error: unknown): GetAccessTokenResult {
        const result = new GetAccessTokenResult();
        result.error = new GetCurrentAccountAccessTokenError(GetAccessTokenResult.createErrorData(error));
        result.state = new GetAccessTokenFailed();

        return result;
    }
}
