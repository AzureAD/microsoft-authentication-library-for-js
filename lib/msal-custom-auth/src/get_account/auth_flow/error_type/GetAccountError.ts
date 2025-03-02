/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class GetAccountError extends AuthFlowErrorBase {
    isCurrentAccountNotFound(): boolean {
        return this.isNoCachedAccountFoundError();
    }
}

export class SignOutError extends AuthFlowErrorBase {
    isUserNotSignedIn(): boolean {
        return this.isNoCachedAccountFoundError();
    }
}

export class GetCurrentAccountAccessTokenError extends AuthFlowErrorBase {
    isCurrentAccountNotFound(): boolean {
        return this.isNoCachedAccountFoundError();
    }

    isInvalidScope(): boolean {
        return true;
    }
}
