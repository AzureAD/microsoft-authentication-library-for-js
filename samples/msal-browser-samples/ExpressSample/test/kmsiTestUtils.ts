/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import { assertKmsiSigninState } from "e2e-test-utils";

export async function verifyKmsiFromResponse(
    target: puppeteer.Page
): Promise<void> {
    const signinState = await target.evaluate(
        "import('/js/auth.js').then((authModule) => authModule.lastSigninState)"
    );

    if (
        !Array.isArray(signinState) ||
        !signinState.every((value) => typeof value === "string")
    ) {
        throw new Error(
            "Authentication response did not contain the signin_state claim"
        );
    }

    assertKmsiSigninState({ signin_state: signinState });
}
