/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class GetAccountError extends AuthFlowErrorBase {
    isCurrentAccountNotFound(): boolean {
        return this.isCurrentAccountNotFoundError();
    }
}

export class SignOutError extends AuthFlowErrorBase {}

export class GetAccessTokenError extends AuthFlowErrorBase {
    isCurrentAccountNotFound(): boolean {
        return this.isCurrentAccountNotFoundError();
    }

    isInvalidScope(): boolean {
        return true;
    }
}
