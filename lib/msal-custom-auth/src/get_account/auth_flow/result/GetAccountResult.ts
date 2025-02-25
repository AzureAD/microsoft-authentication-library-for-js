/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { CustomAuthAccountData } from "../CustomAuthAccountData.js";
import { GetAccountError } from "../error_type/GetAccountError.js";
import { GetAccountCompleted } from "../state/GetAccountCompleted.js";
import { GetAccountFailed } from "../state/GetAccountFailed.js";

/*
 * Result of getting an account.
 */
export class GetAccountResult extends AuthFlowResultBase<
    GetAccountCompleted | GetAccountFailed,
    GetAccountError,
    CustomAuthAccountData
> {
    constructor(resultData?: CustomAuthAccountData) {
        super(new GetAccountCompleted(), resultData);
    }

    static createWithError(error: unknown): GetAccountResult {
        const result = new GetAccountResult();
        result.error = new GetAccountError(GetAccountResult.createErrorData(error));
        result.state = new GetAccountFailed();

        return result;
    }
}
