/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { GetAccountState } from "../../../core/auth_flow/AuthFlowState.js";
import { ResultBase } from "../../../core/auth_flow/ResultBase.js";
import { AccountInfo } from "../model/AccountInfo.js";

/*
 * Result of getting an account.
 */
export class GetAccountResult extends ResultBase<GetAccountState, AccountInfo> {
    constructor(resultData?: AccountInfo) {
        super(resultData);
    }

    get state(): GetAccountState {
        if (this.error) {
            return GetAccountState.Failed;
        }

        if (this.data) {
            return GetAccountState.Completed;
        }

        return GetAccountState.Unknown;
    }
}
