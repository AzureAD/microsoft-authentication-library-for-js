/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { UnexpectedError } from "../../../core/error/UnexpectedError.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";
import { UserAccountAttributes } from "../../../UserAccountAttributes.js";
import {
    SignUpCodeRequiredResult,
    SignUpCompletedResult,
    SignUpPasswordRequiredResult,
} from "../../interaction_client/result/SignUpActionResult.js";
import { SignUpClient } from "../../interaction_client/SignUpClient.js";
import { SignUpSubmitAttributesResult } from "../result/SignUpSubmitAttributesResult.js";
import { SignUpStateHandler } from "./SignUpStateHandler.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { SignUpCodeRequired } from "../state/SignUpCodeRequired.js";
import { SignUpPasswordRequired } from "../state/SignUpPasswordRequired.js";
import { SignUpCompleted } from "../state/SignUpCompleted.js";
import { UserAttribute } from "../../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";

/*
 * Sign-up handler used for the state of attributes required.
 */
export class SignUpAttributesRequiredStateHandler extends SignUpStateHandler {
    constructor(
        username: string,
        signUpClient: SignUpClient,
        signInClient: SignInClient,
        cacheClient: CustomAuthSilentCacheClient,
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        config: CustomAuthBrowserConfiguration,
        public requiredAttributes: Array<UserAttribute>,
    ) {
        super(username, signUpClient, signInClient, cacheClient, correlationId, logger, continuationToken, config);
    }

    /*
     * Submits attributes for sign-up.
     * @param attributes - The attributes to submit.
     * @returns The result of the operation.
     */
    async submitAttributes(attributes: UserAccountAttributes): Promise<SignUpSubmitAttributesResult> {
        if (!attributes || Object.keys(attributes.toRecord()).length === 0) {
            this.logger.error("Attributes are required for sign-up.", this.correlationId);

            return Promise.resolve(
                SignUpSubmitAttributesResult.createWithError(
                    new InvalidArgumentError("attributes", this.correlationId),
                ),
            );
        }

        try {
            this.logger.info("Submitting attributes for sign-up.", this.correlationId);

            const result = await this.signUpClient.submitAttributes({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                continuationToken: this.continuationToken ?? "",
                attributes: attributes.toRecord(),
                username: this.username,
            });

            this.logger.info("Password submitted for sign-up.", this.correlationId);

            if (result instanceof SignUpCodeRequiredResult) {
                // Code required
                this.logger.info("Code required for sign-up.", this.correlationId);

                return new SignUpSubmitAttributesResult(
                    new SignUpCodeRequired(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.signUpClient,
                        this.cacheClient,
                        this.username,
                        result.codeLength,
                        result.interval,
                    ),
                );
            } else if (result instanceof SignUpPasswordRequiredResult) {
                // Password required
                this.logger.info("Password required for sign-up.", this.correlationId);

                return new SignUpSubmitAttributesResult(
                    new SignUpPasswordRequired(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.signUpClient,
                        this.cacheClient,
                        this.username,
                    ),
                );
            } else if (result instanceof SignUpCompletedResult) {
                // Sign-up completed
                this.logger.info("Sign-up completed.", this.correlationId);

                return new SignUpSubmitAttributesResult(
                    new SignUpCompleted(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.cacheClient,
                        this.username,
                    ),
                );
            }

            return SignUpSubmitAttributesResult.createWithError(
                new UnexpectedError("Unknown sign-up result type.", this.correlationId),
            );
        } catch (error) {
            this.logger.errorPii(`Failed to submit attributes for sign up. Error: ${error}.`, this.correlationId);

            return SignUpSubmitAttributesResult.createWithError(error);
        }
    }
}
