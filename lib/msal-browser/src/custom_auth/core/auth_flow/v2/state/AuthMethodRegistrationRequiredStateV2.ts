/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import type { AuthenticationMethodRegistrationV2 } from "../AuthenticationMethodRegistrationV2.js";
import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { AuthMethodRegistrationChallengeResultV2 } from "../result/AuthMethodRegistrationChallengeResultV2.js";
import type { AuthMethodRegistrationRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import { AuthMethodVerificationRequiredStateV2 } from "./AuthMethodVerificationRequiredStateV2.js";
import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { ensureArgumentIsNotEmptyString } from "../../../utils/ArgumentValidator.js";

/**
 * State returned when an authentication method must be registered. Applications
 * select one of the sanitized offered methods and provide its contact value.
 */
export class AuthMethodRegistrationRequiredStateV2 extends AuthFlowActionRequiredStateBase<AuthMethodRegistrationRequiredStateParametersV2> {
    readonly stateType = "authMethodRegistrationRequired";
    readonly methods: readonly AuthenticationMethodRegistrationV2[];

    constructor(
        stateParameters: AuthMethodRegistrationRequiredStateParametersV2
    ) {
        super(stateParameters);
        this.methods = stateParameters.methods;
    }

    /**
     * Registers the selected method and requests its activation challenge.
     * @param method - A method from {@link methods}.
     * @param verificationContact - The email address or phone number to register.
     * @returns The registration activation result.
     */
    async enrollAuthMethod(
        method: AuthenticationMethodRegistrationV2,
        verificationContact: string
    ): Promise<AuthMethodRegistrationChallengeResultV2> {
        const { correlationId, continuationState, flowClient, logger } =
            this.stateParameters;

        try {
            const selectedMethod = this.methods.find(
                (candidate) => candidate.type === method.type
            );
            if (!selectedMethod) {
                throw new InvalidArgumentError("method", correlationId);
            }
            ensureArgumentIsNotEmptyString(
                "verificationContact",
                verificationContact,
                correlationId
            );

            logger.verbose(
                "Registering the selected V2 authentication method.",
                correlationId
            );
            const result = await flowClient.registerAuthMethod({
                correlationId,
                continuationState,
                method: selectedMethod,
                verificationContact,
            });

            return new CustomAuthResultV2(
                new AuthMethodVerificationRequiredStateV2({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient,
                    cacheClient: this.stateParameters.cacheClient,
                    continuationState: result.continuationState,
                    method: selectedMethod,
                    sentTo: result.sentTo,
                    codeLength: result.codeLength,
                }),
                undefined,
                result.continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to register the selected V2 authentication method. Error: '${error}'.`,
                correlationId
            );
            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
