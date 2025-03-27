/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { CustomAuthAccountData } from "../CustomAuthAccountData.js";
import { GetAccountError } from "../error_type/GetAccountError.js";
import { GetAccountCompletedState } from "../state/GetAccountCompletedState.js";
import { GetAccountFailedState } from "../state/GetAccountFailedState.js";

/*
 * Result of getting an account.
 */
export class GetAccountResult extends AuthFlowResultBase<
    GetAccountResultState,
    GetAccountError,
    CustomAuthAccountData
> {
    constructor(resultData?: CustomAuthAccountData) {
        super(new GetAccountCompletedState(), resultData);
    }

    static createWithError(error: unknown): GetAccountResult {
        const result = new GetAccountResult();
        result.error = new GetAccountError(GetAccountResult.createErrorData(error));
        result.state = new GetAccountFailedState();

        return result;
    }
}

export type GetAccountResultState = GetAccountCompletedState | GetAccountFailedState;
