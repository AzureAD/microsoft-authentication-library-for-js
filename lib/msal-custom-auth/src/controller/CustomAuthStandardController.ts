/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StandardController } from "@azure/msal-browser";
import { GetAccountResult } from "../account/auth_flow/result/GetAccountResult.js";
import { SignInResult } from "../sign_in/auth_flow/result/SignInResult.js";
import { SignUpResult } from "../sign_up/auth_flow/result/SignUpResult.js";
import { SignInStartParams, SignInSubmitPasswordParams } from "../sign_in/interaction_client/parameter/SignInParams.js";
import { SignInClient } from "../sign_in/interaction_client/SignInClient.js";
import {
    GetAccountInputs,
    SignInInputs,
    SignUpInputs,
    ResetPasswordInputs,
    CustomAuthActionInputs,
} from "../CustomAuthActionInputs.js";
import { CustomAuthBrowserConfiguration } from "../configuration/CustomAuthConfiguration.js";
import { CustomAuthOperatingContext } from "../operating_context/CustomAuthOperatingContext.js";
import { ICustomAuthStandardController } from "./ICustomAuthStandardController.js";
import { InvalidArgumentError } from "../core/error/InvalidArgumentError.js";
import { AccountInfo } from "../account/auth_flow/model/AccountInfo.js";
import { UnexpectedError } from "../core/error/UnexpectedError.js";
import { ResetPasswordStartResult } from "../reset_password/auth_flow/result/ResetPasswordStartResult.js";
import { CustomAuthAuthority } from "../core/CustomAuthAuthority.js";
import { DefaultPackageInfo } from "../CustomAuthConstants.js";
import {
    SignInCodeSendResult,
    SignInPasswordRequiredResult,
} from "../sign_in/interaction_client/result/SignInActionResult.js";
import { SignUpClient } from "../sign_up/interaction_client/SignUpClient.js";
import { CustomAuthInterationClientFactory } from "../core/interaction_client/CustomAuthInterationClientFactory.js";
import {
    SignUpCodeRequiredResult,
    SignUpPasswordRequiredResult,
} from "../sign_up/interaction_client/result/SignUpActionResult.js";
import { SignUpCodeRequired } from "../sign_up/auth_flow/state/SignUpCodeRequired.js";
import { SignUpPasswordRequired } from "../sign_up/auth_flow/state/SignUpPasswordRequired.js";
import { SignInCodeRequired } from "../sign_in/auth_flow/state/SignInCodeRequired.js";
import { SignInPasswordRequired } from "../sign_in/auth_flow/state/SignInPasswordRequired.js";
import { SignInCompleted } from "../sign_in/auth_flow/state/SignInCompleted.js";
import { ICustomAuthApiClient } from "../core/network_client/custom_auth_api/ICustomAuthApiClient.js";
import { CustomAuthApiClient } from "../core/network_client/custom_auth_api/CustomAuthApiClient.js";
import { FetchHttpClient } from "../core/network_client/http_client/FetchHttpClient.js";

/*
 * Controller for standard native auth operations.
 */
export class CustomAuthStandardController extends StandardController implements ICustomAuthStandardController {
    /*
     * The client to use for sign-in operations.
     */
    private readonly signInClient: SignInClient;

    /**
     * The client to use for sign-up operations.
     */
    private readonly signUpClient: SignUpClient;

    /*
     * The configuration for the client.
     */
    private readonly customAuthConfig: CustomAuthBrowserConfiguration;

    /**
     * The authority to use for the client.
     */
    private readonly authority: CustomAuthAuthority;

    /*
     * Constructor for CustomAuthStandardController.
     * @param operatingContext - The operating context for the controller.
     * @param customAuthApiClient - The client to use for custom auth API operations.
     */
    constructor(operatingContext: CustomAuthOperatingContext, customAuthApiClient?: ICustomAuthApiClient) {
        super(operatingContext);

        this.logger = this.logger.clone(DefaultPackageInfo.SKU, DefaultPackageInfo.VERSION);
        this.customAuthConfig = operatingContext.getCustomAuthConfig();
        this.authority = new CustomAuthAuthority(
            this.config.auth.authority,
            this.customAuthConfig.customAuth?.authApiProxyUrl,
        );

        const interactionClientFactory = new CustomAuthInterationClientFactory(
            this.customAuthConfig,
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            this.eventHandler,
            this.navigationClient,
            this.performanceClient,
            customAuthApiClient ??
                new CustomAuthApiClient(
                    this.authority.getCustomAuthApiDomain(),
                    this.config.auth.clientId,
                    new FetchHttpClient(this.logger),
                ),
            this.authority,
        );

        this.signInClient = interactionClientFactory.create(SignInClient);
        this.signUpClient = interactionClientFactory.create(SignUpClient);

        // Create more interaction clients here, such as SignUpClient, ResetPasswordClient, etc.
    }

    /*
     * Gets the current account from the cache.
     * @param getAccountInputs - Inputs for getting the current cached account
     * @returns - A promise that resolves to GetAccountResult
     */
    async getCurrentAccount(getAccountInputs: GetAccountInputs): Promise<GetAccountResult> {
        const correlationId = this.getCorrelationId(getAccountInputs);

        throw new Error(`Method not implemented with Parameter ${correlationId}.`);
    }

    /*
     * Signs the user in.
     * @param signInInputs - Inputs for signing in the user.
     * @returns The result of the operation.
     */
    async signIn(signInInputs: SignInInputs): Promise<SignInResult> {
        const correlationId = this.getCorrelationId(signInInputs);

        if (!this.isUsernameValid(signInInputs.username)) {
            this.logger.error("Invalid username provided in sign-in inputs.");

            return Promise.resolve(
                SignInResult.createWithError(new InvalidArgumentError("signUpInputs.username", correlationId)),
            );
        }

        try {
            // start the signin flow
            const signInStartParams: SignInStartParams = {
                clientId: this.config.auth.clientId,
                correlationId: correlationId,
                challengeType: this.customAuthConfig.customAuth.challengeTypes ?? [],
                scopes: signInInputs.scopes ?? [],
                username: signInInputs.username,
                password: signInInputs.password,
            };

            this.logger.info(`Starting sign-in flow ${!!signInInputs.password ? "with" : "without"} password.`);

            const startResult = await this.signInClient.start(signInStartParams);

            this.logger.info("Sign-in flow started.");

            if (startResult instanceof SignInCodeSendResult) {
                // require code
                this.logger.info("Code required for sign-in.");

                return new SignInResult(
                    new SignInCodeRequired(
                        startResult.correlationId,
                        startResult.continuationToken,
                        this.logger,
                        this.customAuthConfig,
                        this.signInClient,
                        signInInputs.username,
                        startResult.codeLength,
                        signInInputs.scopes ?? [],
                    ),
                );
            } else if (startResult instanceof SignInPasswordRequiredResult) {
                // require password
                this.logger.info("Password required for sign-in.");

                if (!signInInputs.password) {
                    this.logger.info("Password required but not provided. Returning password required state.");

                    return new SignInResult(
                        new SignInPasswordRequired(
                            startResult.correlationId,
                            startResult.continuationToken,
                            this.logger,
                            this.customAuthConfig,
                            this.signInClient,
                            signInInputs.username,
                            signInInputs.scopes ?? [],
                        ),
                    );
                }

                this.logger.info("Submitting password for sign-in.");

                // if the password is provided, then try to get token silently.
                const submitPasswordParams: SignInSubmitPasswordParams = {
                    clientId: this.config.auth.clientId,
                    correlationId: correlationId,
                    challengeType: this.customAuthConfig.customAuth.challengeTypes ?? [],
                    scopes: signInInputs.scopes ?? [],
                    continuationToken: startResult.continuationToken,
                    password: signInInputs.password,
                    username: signInInputs.username,
                };

                const completedResult = await this.signInClient.submitPassword(submitPasswordParams);

                this.logger.info("Sign-in flow completed.");

                const accountInfo = new AccountInfo(
                    completedResult.authenticationResult.account,
                    correlationId,
                    this.customAuthConfig,
                );

                return new SignInResult(new SignInCompleted(), accountInfo);
            }

            this.logger.error("Unexpected sign-in result type. Returning error.");

            throw new UnexpectedError("Unknow sign-in result type");
        } catch (error) {
            this.logger.error(`An error occurred during starting sign-in: ${error}`);

            return SignInResult.createWithError(error);
        }
    }

    /*
     * Signs the user up.
     * @param signUpInputs - Inputs for signing up the user.
     * @returns The result of the operation
     */
    async signUp(signUpInputs: SignUpInputs): Promise<SignUpResult> {
        const correlationId = this.getCorrelationId(signUpInputs);

        if (!this.isUsernameValid(signUpInputs.username)) {
            return Promise.resolve(
                SignUpResult.createWithError(new InvalidArgumentError("signUpInputs.username", correlationId)),
            );
        }

        try {
            this.logger.info(
                `Starting sign-up flow${
                    !!signUpInputs.password
                        ? ` with ${!!signUpInputs.attributes ? "password and attributes" : "password"}`
                        : ""
                }.`,
            );

            const startResult = await this.signUpClient.start({
                clientId: this.config.auth.clientId,
                correlationId: correlationId,
                challengeType: this.customAuthConfig.customAuth.challengeTypes ?? [],
                username: signUpInputs.username,
                password: signUpInputs.password,
                attributes: signUpInputs.attributes?.toRecord(),
            });

            this.logger.info("Sign-up flow started.");

            if (startResult instanceof SignUpCodeRequiredResult) {
                // Code required
                this.logger.info("Code required for sign-up.");

                return new SignUpResult(
                    new SignUpCodeRequired(
                        startResult.correlationId,
                        startResult.continuationToken,
                        this.logger,
                        this.customAuthConfig,
                        this.signInClient,
                        this.signUpClient,
                        signUpInputs.username,
                        startResult.codeLength,
                        startResult.interval,
                    ),
                );
            } else if (startResult instanceof SignUpPasswordRequiredResult) {
                // Password required
                this.logger.info("Password required for sign-up.");

                return new SignUpResult(
                    new SignUpPasswordRequired(
                        startResult.correlationId,
                        startResult.continuationToken,
                        this.logger,
                        this.customAuthConfig,
                        this.signInClient,
                        this.signUpClient,
                        signUpInputs.username,
                    ),
                );
            }

            this.logger.error("Unexpected sign-up result type. Returning error.");

            throw new UnexpectedError("Unknown sign-up result type");
        } catch (error) {
            this.logger.error(`An error occurred during starting sign-up: ${error}`);

            return SignUpResult.createWithError(error);
        }
    }

    /*
     * Resets the user's password.
     * @param resetPasswordInputs - Inputs for resetting the user's password.
     * @returns The result of the operation.
     */
    async resetPassword(resetPasswordInputs: ResetPasswordInputs): Promise<ResetPasswordStartResult> {
        const correlationId = this.getCorrelationId(resetPasswordInputs);

        if (!this.isUsernameValid(resetPasswordInputs.username)) {
            return Promise.resolve(
                ResetPasswordStartResult.createWithError(
                    new InvalidArgumentError("resetPasswordInputs.username", correlationId),
                ),
            );
        }

        throw new Error(`Method not implemented with Parameter ${correlationId}.`);
    }

    private getCorrelationId(actionInputs: CustomAuthActionInputs): string {
        return actionInputs.correlationId || this.browserCrypto.createNewGuid();
    }

    private isUsernameValid(username: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !!username && emailRegex.test(username);
    }
}
