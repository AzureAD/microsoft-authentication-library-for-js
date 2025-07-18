/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    MfaMethodSelectionRequiredStateParameters,
    MfaStateParameters,
    MfaVerificationRequiredStateParameters,
} from "./MfaStateParameters.js";
import { MfaSubmitChallengeResult } from "../result/MfaSubmitChallengeResult.js";
import { MfaGetAuthMethodsResult } from "../result/MfaGetAuthMethodsResult.js";
import { MfaRequestChallengeResult } from "../result/MfaRequestChallengeResult.js";
import {
    MfaSubmitChallengeParams,
    MfaGetAuthMethodsParams,
    MfaRequestChallengeParams,
} from "../../../interaction_client/mfa/parameter/MfaClientParameters.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import { MfaCompletedState } from "./MfaCompletedState.js";
import {
    MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE,
    MFA_VERIFICATION_REQUIRED_RESULT_TYPE,
} from "../../../interaction_client/mfa/result/MfaActionResult.js";
import { UnexpectedError } from "../../../error/UnexpectedError.js";
import { ensureArgumentIsNotEmptyString } from "../../../utils/ArgumentValidator.js";
import { AuthenticationMethod } from "../../../network_client/custom_auth_api/types/ApiResponseTypes.js";
import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";

abstract class MfaState<
    TParameters extends MfaStateParameters
> extends AuthFlowActionRequiredStateBase<TParameters> {
    /**
     * Requests an MFA challenge for a specific authentication method.
     * @param authMethodId The authentication method ID to use for the challenge. If not provided, uses the default method.
     * @returns Promise that resolves to MfaRequestChallengeResult.
     */
    async requestChallengeInternal(
        authMethodId?: string
    ): Promise<MfaRequestChallengeResult> {
        try {
            this.stateParameters.logger.verbose(
                `Requesting MFA challenge with authentication method - '${authMethodId}'.`,
                this.stateParameters.correlationId
            );

            const requestParams: MfaRequestChallengeParams = {
                correlationId: this.stateParameters.correlationId,
                continuationToken: this.stateParameters.continuationToken ?? "",
                challengeType:
                    this.stateParameters.config.customAuth.challengeTypes ?? [],
                authMethodId: authMethodId,
            };

            const result =
                await this.stateParameters.mfaClient.requestChallenge(
                    requestParams
                );

            this.stateParameters.logger.verbose(
                "MFA challenge requested successfully.",
                this.stateParameters.correlationId
            );

            if (result.type === MFA_VERIFICATION_REQUIRED_RESULT_TYPE) {
                // Verification required
                this.stateParameters.logger.verbose(
                    "MFA verification required.",
                    this.stateParameters.correlationId
                );

                return new MfaRequestChallengeResult(
                    new MfaVerificationRequiredState({
                        correlationId: result.correlationId,
                        continuationToken: result.continuationToken,
                        config: this.stateParameters.config,
                        logger: this.stateParameters.logger,
                        mfaClient: this.stateParameters.mfaClient,
                        cacheClient: this.stateParameters.cacheClient,
                        challengeChannel: result.challengeChannel,
                        challengeTargetLabel: result.challengeTargetLabel,
                        codeLength: result.codeLength,
                        selectedAuthMethodId: authMethodId,
                        scopes: this.stateParameters.scopes ?? [],
                    })
                );
            } else if (
                result.type === MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE
            ) {
                // Method selection required
                this.stateParameters.logger.verbose(
                    "MFA method selection required.",
                    this.stateParameters.correlationId
                );

                return new MfaRequestChallengeResult(
                    new MfaMethodSelectionRequiredState({
                        correlationId: result.correlationId,
                        continuationToken: result.continuationToken,
                        config: this.stateParameters.config,
                        logger: this.stateParameters.logger,
                        mfaClient: this.stateParameters.mfaClient,
                        cacheClient: this.stateParameters.cacheClient,
                        authMethods: result.authMethods,
                        scopes: this.stateParameters.scopes ?? [],
                    })
                );
            }

            return MfaRequestChallengeResult.createWithError(
                new UnexpectedError(
                    "Unexpected result type from MFA request challenge.",
                    this.stateParameters.correlationId
                )
            );
        } catch (error) {
            this.stateParameters.logger.errorPii(
                `Failed to request MFA challenge. Error: ${error}.`,
                this.stateParameters.correlationId
            );

            return MfaRequestChallengeResult.createWithError(error);
        }
    }
}

/**
 * State indicating that MFA is required and awaiting user action.
 * This state allows the developer to pause execution before sending the code to the user's email.
 */
export class MfaAwaitingState extends MfaState<MfaStateParameters> {
    /**
     * Requests an MFA challenge to be sent to the user using the default authentication method.
     * @returns Promise that resolves to MfaRequestChallengeResult.
     */
    async requestChallenge(): Promise<MfaRequestChallengeResult> {
        return this.requestChallengeInternal();
    }
}

/**
 * State indicating that MFA verification is required.
 * The challenge has been sent and the user needs to provide the code.
 */
export class MfaVerificationRequiredState extends MfaState<MfaVerificationRequiredStateParameters> {
    /**
     * Gets the length of the code that the user needs to provide.
     * @returns The expected code length.
     */
    getCodeLength(): number {
        return this.stateParameters.codeLength;
    }

    /**
     * Gets the channel through which the challenge was sent.
     * @returns The challenge channel (e.g., "email").
     */
    getChannel(): string {
        return this.stateParameters.challengeChannel;
    }

    /**
     * Gets the target label indicating where the challenge was sent.
     * @returns The challenge target label (e.g., masked email address).
     */
    getSentTo(): string {
        return this.stateParameters.challengeTargetLabel;
    }

    /**
     * Submits the MFA challenge (e.g., OTP code) to complete the authentication.
     * @param code The challenge code (e.g., OTP code) entered by the user.
     * @returns Promise that resolves to MfaSubmitChallengeResult.
     */
    async submitChallenge(code: string): Promise<MfaSubmitChallengeResult> {
        try {
            this.ensureCodeIsValid(code, this.getCodeLength());

            this.stateParameters.logger.verbose(
                "Submitting MFA challenge.",
                this.stateParameters.correlationId
            );

            const submitParams: MfaSubmitChallengeParams = {
                correlationId: this.stateParameters.correlationId,
                continuationToken: this.stateParameters.continuationToken ?? "",
                scopes: this.stateParameters.scopes ?? [],
                code: code,
            };

            const result = await this.stateParameters.mfaClient.submitChallenge(
                submitParams
            );

            this.stateParameters.logger.verbose(
                "MFA challenge submitted successfully.",
                this.stateParameters.correlationId
            );

            const accountInfo = new CustomAuthAccountData(
                result.authenticationResult.account,
                this.stateParameters.config,
                this.stateParameters.cacheClient,
                this.stateParameters.logger,
                this.stateParameters.correlationId
            );

            return new MfaSubmitChallengeResult(
                new MfaCompletedState(),
                accountInfo
            );
        } catch (error) {
            this.stateParameters.logger.errorPii(
                `Failed to submit MFA challenge. Error: ${error}.`,
                this.stateParameters.correlationId
            );

            return MfaSubmitChallengeResult.createWithError(error);
        }
    }

    /**
     * Gets the available authentication methods for the user.
     * @returns Promise that resolves to MfaGetAuthMethodsResult.
     */
    async getAuthMethods(): Promise<MfaGetAuthMethodsResult> {
        try {
            this.stateParameters.logger.verbose(
                "Getting available MFA authentication methods.",
                this.stateParameters.correlationId
            );

            const getAuthMethodsParams: MfaGetAuthMethodsParams = {
                correlationId: this.stateParameters.correlationId,
                continuationToken: this.stateParameters.continuationToken ?? "",
            };

            const result = await this.stateParameters.mfaClient.getAuthMethods(
                getAuthMethodsParams
            );

            this.stateParameters.logger.verbose(
                "MFA authentication methods retrieved successfully.",
                this.stateParameters.correlationId
            );

            return new MfaGetAuthMethodsResult(
                new MfaMethodSelectionRequiredState({
                    correlationId: result.correlationId,
                    continuationToken: result.continuationToken,
                    config: this.stateParameters.config,
                    logger: this.stateParameters.logger,
                    mfaClient: this.stateParameters.mfaClient,
                    cacheClient: this.stateParameters.cacheClient,
                    authMethods: result.authMethods,
                })
            );
        } catch (error) {
            this.stateParameters.logger.errorPii(
                `Failed to get MFA authentication methods. Error: ${error}.`,
                this.stateParameters.correlationId
            );

            return MfaGetAuthMethodsResult.createWithError(error);
        }
    }

    /**
     * Requests an MFA challenge for a specific authentication method.
     * @returns Promise that resolves to MfaRequestChallengeResult.
     */
    async requestChallenge(): Promise<MfaRequestChallengeResult> {
        return this.requestChallengeInternal();
    }
}

/**
 * State indicating that method selection is required for MFA.
 * Multiple authentication methods are available and the user needs to select one.
 */
export class MfaMethodSelectionRequiredState extends MfaState<MfaMethodSelectionRequiredStateParameters> {
    /**
     * Gets the available authentication methods for the user.
     * This returns the methods that were already fetched and are available for selection.
     * @returns Array of available authentication methods.
     */
    getAuthMethods(): AuthenticationMethod[] {
        return this.stateParameters.authMethods;
    }

    /**
     * Requests an MFA challenge for a specific authentication method.
     * @param authMethodId The authentication method ID to use for the challenge. If not provided, uses the default method.
     * @returns Promise that resolves to MfaRequestChallengeResult.
     */
    async requestChallenge(
        authMethodId: string
    ): Promise<MfaRequestChallengeResult> {
        try {
            ensureArgumentIsNotEmptyString(
                "authMethodId",
                authMethodId,
                this.stateParameters.correlationId
            );

            return await this.requestChallengeInternal(authMethodId);
        } catch (error) {
            this.stateParameters.logger.errorPii(
                `Failed to request MFA challenge. Error: ${error}.`,
                this.stateParameters.correlationId
            );

            return MfaRequestChallengeResult.createWithError(error);
        }
    }
}
