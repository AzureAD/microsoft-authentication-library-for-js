/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IMsalContext } from "./MsalContext";
import { AuthenticationResult } from "@azure/msal-browser";

type FaaCFunction = <T>(args: T) => React.ReactNode;

export function getChildrenOrFunction<T>(
    children: React.ReactNode | FaaCFunction,
    args: T
): React.ReactNode {
    if (typeof children === "function") {
        return children(args);
    }
    return children;
}

export function defaultLoginHandler(
    context: IMsalContext
): Promise<AuthenticationResult> {
    const { instance } = context;
    return instance.loginPopup({
        scopes: ["user.read"],
        prompt: "select_account",
    });
}
