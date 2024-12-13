/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CustomAuthPublicClientApplication,
    SignInCodeRequiredStateHandler,
    SignInInputs,
    SignInPasswordRequiredStateHandler,
    SignInState,
} from "@azure/msal-custom-auth";
import { customAuthConfig } from "./CustomAuthConfig.js";

// This sample demonstrates how to sign in a user using the MSAL Native Auth library.
// Currently, this sample doesn't work and is only used to demonstrate the usage of the library.
export async function signin(
    username: string,
    password?: string
): Promise<void> {
    const app = CustomAuthPublicClientApplication.create(customAuthConfig);

    const signInInputs: SignInInputs = {
        username: username,
    };

    const result = await app.signIn(signInInputs);

    switch (result.state) {
        case SignInState.Completed:
            // read the account info from result by result.data and use it to get account data, tokens, and sign out.
            return;
        case SignInState.CodeRequired:
            // collect code from customer.
            const code = "test-code";

            const submitCodeResult = await (
                result.stateHandler as SignInCodeRequiredStateHandler
            ).submitCode(code);

            switch (submitCodeResult.state) {
                case SignInState.Completed:
                    // read the account info from result by submitCodeResult.data and use it to get account data, tokens, and sign out.
                    return;
                case SignInState.Failed:
                    // check the error type by calling result.error and handle error
                    break;
                default:
                    throw new Error("Invalid sign in state");
            }
        case SignInState.PasswordRequired:
            // collect password from customer.
            const password = "test-pwd";

            const submitPasswordResult = await (
                result.stateHandler as SignInPasswordRequiredStateHandler
            ).sumbmitPassword(password);

            switch (submitPasswordResult.state) {
                case SignInState.Completed:
                    // read the account info from result by submitPasswordResult.data and use it to get account data, tokens, and sign out.
                    return;
                case SignInState.Failed:
                    // check the error type by calling result.error and handle error
                    break;
                default:
                    throw new Error("Invalid sign in state");
            }
        case SignInState.Failed:
            // check the error type by calling result.error and handle error
            return;
        default:
            throw new Error("Invalid sign in state");
    }
}
