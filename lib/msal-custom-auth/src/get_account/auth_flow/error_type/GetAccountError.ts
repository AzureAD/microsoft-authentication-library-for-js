/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class GetAccountError extends AuthFlowErrorBase {
    /**
     * Checks if during account retrieval, no cached account found.
     * @returns {boolean} True if no cached account found, false otherwise.
     */
    isCurrentAccountNotFound(): boolean {
        return this.isNoCachedAccountFoundError();
    }
}

export class SignOutError extends AuthFlowErrorBase {
    /**
     * Checks if no cached account found during sign-in.
     * @returns {boolean} True if no cached account found, false otherwise.
     */
    isUserNotSignedIn(): boolean {
        return this.isNoCachedAccountFoundError();
    }
}

export class GetCurrentAccountAccessTokenError extends AuthFlowErrorBase {
    /**
     * Checks if no cached account found during getting access token.
     * @returns {boolean} True if no cached account found, false otherwise.
     */
    isCurrentAccountNotFound(): boolean {
        return this.isNoCachedAccountFoundError();
    }
}
