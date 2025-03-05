/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StandardController } from "@azure/msal-browser";
import { GetAccountResult } from "../get_account/auth_flow/result/GetAccountResult.js";
import { SignInResult } from "../sign_in/auth_flow/result/SignInResult.js";
import { SignUpResult } from "../sign_up/auth_flow/result/SignUpResult.js";
import { SignInStartParams, SignInSubmitPasswordParams } from "../sign_in/interaction_client/parameter/SignInParams.js";
import { SignInClient } from "../sign_in/interaction_client/SignInClient.js";
import {
    AccountRetrievalInputs,
    SignInInputs,
    SignUpInputs,
    ResetPasswordInputs,
    CustomAuthActionInputs,
} from "../CustomAuthActionInputs.js";
import { CustomAuthBrowserConfiguration } from "../configuration/CustomAuthConfiguration.js";
import { CustomAuthOperatingContext } from "../operating_context/CustomAuthOperatingContext.js";
import { ICustomAuthStandardController } from "./ICustomAuthStandardController.js";
import { CustomAuthAccountData } from "../get_account/auth_flow/CustomAuthAccountData.js";
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
import { ResetPasswordClient } from "../reset_password/interaction_client/ResetPasswordClient.js";
import { ResetPasswordCodeRequired } from "../reset_password/auth_flow/state/ResetPasswordCodeRequired.js";
import { NoCachedAccountFoundError } from "../core/error/GetCurrentAccountError.js";
import { ArgumentValidator } from "../core/utils/ArgumentValidator.js";
import { UserAlreadySignedInError } from "../core/error/UserAlreadySignedInError.js";
import { CustomAuthSilentCacheClient } from "../get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { UnsupportedEnvironmentError } from "../core/error/UnsupportedEnvironmentError.js";

/*
 * Controller for standard native auth operations.
 */
export class CustomAuthStandardController extends StandardController implements ICustomAuthStandardController {
    private readonly signInClient: SignInClient;
    private readonly signUpClient: SignUpClient;
    private readonly resetPasswordClient: ResetPasswordClient;
    private readonly cacheClient: CustomAuthSilentCacheClient;
    private readonly customAuthConfig: CustomAuthBrowserConfiguration;
    private readonly authority: CustomAuthAuthority;

    /*
     * Constructor for CustomAuthStandardController.
     * @param operatingContext - The operating context for the controller.
     * @param customAuthApiClient - The client to use for custom auth API operations.
     */
    constructor(operatingContext: CustomAuthOperatingContext, customAuthApiClient?: ICustomAuthApiClient) {
        super(operatingContext);

        if (!this.isBrowserEnvironment) {
            this.logger.error("The SDK can only be used in a browser environment.");
            throw new UnsupportedEnvironmentError();
        }

        this.logger = this.logger.clone(DefaultPackageInfo.SKU, DefaultPackageInfo.VERSION);
        this.customAuthConfig = operatingContext.getCustomAuthConfig();

        this.authority = new CustomAuthAuthority(
            this.customAuthConfig.auth.authority,
            this.customAuthConfig,
            this.networkClient,
            this.browserStorage,
            this.logger,
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
                    this.customAuthConfig.auth.clientId,
                    new FetchHttpClient(this.logger),
                ),
            this.authority,
        );

        this.signInClient = interactionClientFactory.create(SignInClient);
        this.signUpClient = interactionClientFactory.create(SignUpClient);
        this.resetPasswordClient = interactionClientFactory.create(ResetPasswordClient);
        this.cacheClient = interactionClientFactory.create(CustomAuthSilentCacheClient);
    }

    /*
     * Gets the current account from the cache.
     * @param accountRetrievalInputs - Inputs for getting the current cached account
     * @returns {GetAccountResult} The account result
     */
    getCurrentAccount(accountRetrievalInputs?: AccountRetrievalInputs): GetAccountResult {
        const correlationId = this.getCorrelationId(accountRetrievalInputs);
        try {
            this.logger.info("Getting current account data.", correlationId);

            const account = this.cacheClient.getCurrentAccount(correlationId);

            if (account) {
                this.logger.info("Account data found.", correlationId);

                return new GetAccountResult(
                    new CustomAuthAccountData(
                        account,
                        this.customAuthConfig,
                        this.cacheClient,
                        this.logger,
                        correlationId,
                    ),
                );
            }

            throw new NoCachedAccountFoundError(correlationId);
        } catch (error) {
            this.logger.errorPii(`An error occurred during getting current account: ${error}`, correlationId);

            return GetAccountResult.createWithError(error);
        }
    }

    /*
     * Signs the user in.
     * @param signInInputs - Inputs for signing in the user.
     * @returns {Promise<SignInResult>} The result of the operation.
     */
    async signIn(signInInputs: SignInInputs): Promise<SignInResult> {
        const correlationId = this.getCorrelationId(signInInputs);

        try {
            ArgumentValidator.ensureArgumentIsNotNullOrUndefined("signInInputs", signInInputs, correlationId);

            ArgumentValidator.ensureArgumentIsNotEmptyString(
                "signInInputs.username",
                signInInputs.username,
                correlationId,
            );
            this.ensureUserNotSignedIn(correlationId);

            // start the signin flow
            const signInStartParams: SignInStartParams = {
                clientId: this.customAuthConfig.auth.clientId,
                correlationId: correlationId,
                challengeType: this.customAuthConfig.customAuth.challengeTypes ?? [],
                username: signInInputs.username,
                password: signInInputs.password,
            };

            this.logger.info(
                `Starting sign-in flow ${!!signInInputs.password ? "with" : "without"} password.`,
                correlationId,
            );

            const startResult = await this.signInClient.start(signInStartParams);

            this.logger.info("Sign-in flow started.", correlationId);

            if (startResult instanceof SignInCodeSendResult) {
                // require code
                this.logger.info("Code required for sign-in.", correlationId);

                return new SignInResult(
                    new SignInCodeRequired(
                        startResult.correlationId,
                        startResult.continuationToken,
                        this.logger,
                        this.customAuthConfig,
                        this.signInClient,
                        this.cacheClient,
                        signInInputs.username,
                        startResult.codeLength,
                        signInInputs.scopes ?? [],
                    ),
                );
            } else if (startResult instanceof SignInPasswordRequiredResult) {
                // require password
                this.logger.info("Password required for sign-in.", correlationId);

                if (!signInInputs.password) {
                    this.logger.info(
                        "Password required but not provided. Returning password required state.",
                        correlationId,
                    );

                    return new SignInResult(
                        new SignInPasswordRequired(
                            startResult.correlationId,
                            startResult.continuationToken,
                            this.logger,
                            this.customAuthConfig,
                            this.signInClient,
                            this.cacheClient,
                            signInInputs.username,
                            signInInputs.scopes ?? [],
                        ),
                    );
                }

                this.logger.info("Submitting password for sign-in.", correlationId);

                // if the password is provided, then try to get token silently.
                const submitPasswordParams: SignInSubmitPasswordParams = {
                    clientId: this.customAuthConfig.auth.clientId,
                    correlationId: correlationId,
                    challengeType: this.customAuthConfig.customAuth.challengeTypes ?? [],
                    scopes: signInInputs.scopes ?? [],
                    continuationToken: startResult.continuationToken,
                    password: signInInputs.password,
                    username: signInInputs.username,
                };

                const completedResult = await this.signInClient.submitPassword(submitPasswordParams);

                this.logger.info("Sign-in flow completed.", correlationId);

                const accountInfo = new CustomAuthAccountData(
                    completedResult.authenticationResult.account,
                    this.customAuthConfig,
                    this.cacheClient,
                    this.logger,
                    correlationId,
                );

                return new SignInResult(new SignInCompleted(), accountInfo);
            }

            this.logger.error("Unexpected sign-in result type. Returning error.", correlationId);

            throw new UnexpectedError("Unknow sign-in result type", correlationId);
        } catch (error) {
            this.logger.errorPii(`An error occurred during starting sign-in: ${error}`, correlationId);

            return SignInResult.createWithError(error);
        }
    }

    /*
     * Signs the user up.
     * @param signUpInputs - Inputs for signing up the user.
     * @returns {Promise<SignUpResult>} The result of the operation
     */
    async signUp(signUpInputs: SignUpInputs): Promise<SignUpResult> {
        const correlationId = this.getCorrelationId(signUpInputs);

        try {
            ArgumentValidator.ensureArgumentIsNotNullOrUndefined("signUpInputs", signUpInputs, correlationId);

            ArgumentValidator.ensureArgumentIsNotEmptyString(
                "signUpInputs.username",
                signUpInputs.username,
                correlationId,
            );
            this.ensureUserNotSignedIn(correlationId);

            this.logger.info(
                `Starting sign-up flow${
                    !!signUpInputs.password
                        ? ` with ${!!signUpInputs.attributes ? "password and attributes" : "password"}`
                        : ""
                }.`,
                correlationId,
            );

            const startResult = await this.signUpClient.start({
                clientId: this.customAuthConfig.auth.clientId,
                correlationId: correlationId,
                challengeType: this.customAuthConfig.customAuth.challengeTypes ?? [],
                username: signUpInputs.username,
                password: signUpInputs.password,
                attributes: signUpInputs.attributes?.toRecord(),
            });

            this.logger.info("Sign-up flow started.", correlationId);

            if (startResult instanceof SignUpCodeRequiredResult) {
                // Code required
                this.logger.info("Code required for sign-up.", correlationId);

                return new SignUpResult(
                    new SignUpCodeRequired(
                        startResult.correlationId,
                        startResult.continuationToken,
                        this.logger,
                        this.customAuthConfig,
                        this.signInClient,
                        this.signUpClient,
                        this.cacheClient,
                        signUpInputs.username,
                        startResult.codeLength,
                        startResult.interval,
                    ),
                );
            } else if (startResult instanceof SignUpPasswordRequiredResult) {
                // Password required
                this.logger.info("Password required for sign-up.", correlationId);

                return new SignUpResult(
                    new SignUpPasswordRequired(
                        startResult.correlationId,
                        startResult.continuationToken,
                        this.logger,
                        this.customAuthConfig,
                        this.signInClient,
                        this.signUpClient,
                        this.cacheClient,
                        signUpInputs.username,
                    ),
                );
            }

            this.logger.error("Unexpected sign-up result type. Returning error.", correlationId);

            throw new UnexpectedError("Unknown sign-up result type", correlationId);
        } catch (error) {
            this.logger.errorPii(`An error occurred during starting sign-up: ${error}`, correlationId);

            return SignUpResult.createWithError(error);
        }
    }

    /*
     * Resets the user's password.
     * @param resetPasswordInputs - Inputs for resetting the user's password.
     * @returns {Promise<ResetPasswordStartResult>} The result of the operation.
     */
    async resetPassword(resetPasswordInputs: ResetPasswordInputs): Promise<ResetPasswordStartResult> {
        const correlationId = this.getCorrelationId(resetPasswordInputs);

        try {
            ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                "resetPasswordInputs",
                resetPasswordInputs,
                correlationId,
            );

            ArgumentValidator.ensureArgumentIsNotEmptyString(
                "resetPasswordInputs.username",
                resetPasswordInputs.username,
                correlationId,
            );
            this.ensureUserNotSignedIn(correlationId);

            this.logger.info("Starting password-reset flow.", correlationId);

            const startResult = await this.resetPasswordClient.start({
                clientId: this.customAuthConfig.auth.clientId,
                correlationId: correlationId,
                challengeType: this.customAuthConfig.customAuth.challengeTypes ?? [],
                username: resetPasswordInputs.username,
            });

            this.logger.info("Password-reset flow started.", correlationId);

            return new ResetPasswordStartResult(
                new ResetPasswordCodeRequired(
                    startResult.correlationId,
                    startResult.continuationToken,
                    this.logger,
                    this.customAuthConfig,
                    this.resetPasswordClient,
                    this.signInClient,
                    this.cacheClient,
                    resetPasswordInputs.username,
                    startResult.codeLength,
                ),
            );
        } catch (error) {
            this.logger.errorPii(`An error occurred during starting reset-password: ${error}`, correlationId);

            return ResetPasswordStartResult.createWithError(error);
        }
    }

    private getCorrelationId(actionInputs: CustomAuthActionInputs | undefined): string {
        return actionInputs?.correlationId || this.browserCrypto.createNewGuid();
    }

    private ensureUserNotSignedIn(correlationId: string): void {
        const account = this.getCurrentAccount({
            correlationId: correlationId,
        });

        if (account && !!account.data) {
            this.logger.error("User has already signed in.", correlationId);

            throw new UserAlreadySignedInError(correlationId);
        }
    }
}
