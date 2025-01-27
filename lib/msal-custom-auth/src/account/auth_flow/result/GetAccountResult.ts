/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { GetAccountState } from "../../../core/auth_flow/AuthFlowState.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { GetAccountError } from "../error_type/GetAccountError.js";
import { AccountInfo } from "../model/AccountInfo.js";

/*
 * Result of getting an account.
 */
export class GetAccountResult extends AuthFlowResultBase<
    GetAccountState,
    GetAccountError,
    AccountInfo
> {
    constructor(resultData?: AccountInfo) {
        super(resultData);
    }

    get state(): GetAccountState {
        if (!!this.error) {
            return GetAccountState.Failed;
        }

        if (!!this.data) {
            return GetAccountState.Completed;
        }

        return GetAccountState.Unknown;
    }
}
