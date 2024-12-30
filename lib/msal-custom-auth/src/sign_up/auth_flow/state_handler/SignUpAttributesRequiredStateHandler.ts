/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { UserAccountAttributes } from "../../../UserAccountAttributes.js";
import { SignUpSubmitAttributesResult } from "../result/SignUpSubmitAttributesResult.js";
import { SignUpStateHandler } from "./SignUpStateHandler.js";

/*
 * Sign-up handler used for the state of attributes required.
 */
export class SignUpAttributesRequiredStateHandler extends SignUpStateHandler {
    /*
     * Submits attributes for sign-up.
     * @param attributes - The attributes to submit.
     * @returns The result of the operation.
     */
    async sumbmitAttributes(
        attributes: UserAccountAttributes,
    ): Promise<SignUpSubmitAttributesResult> {
        if (!attributes) {
            return Promise.resolve(
                SignUpSubmitAttributesResult.createWithError(
                    new InvalidArgumentError("attributes", this.correlationId),
                ),
            );
        }

        throw new Error("Method not implemented.");
    }
}
