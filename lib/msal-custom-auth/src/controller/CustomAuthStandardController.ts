/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, StandardController } from "@azure/msal-browser";
import { GetAccountResult } from "../get_account/auth_flow/result/GetAccountResult.js";
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
import { GetCurrentAccountError, NoSignedInAccountFound } from "../core/error/GetCurrentAccountError.js";
import { ArgumentValidator } from "../core/utils/ArgumentValidator.js";
import { UserAlreadySignedInError } from "../core/error/UserAlreadySignedInError.js";
import { CustomAuthTokenClient } from "../get_account/interaction_client/CustomAuthTokeClient.js";

/*
 * Controller for standard native auth operations.
 */
export class CustomAuthStandardController extends StandardController implements ICustomAuthStandardController {
    /*
     * The client to use for sign-in operations.
     */
    private readonly signInClient: SignInClient;

    /*
     * The client to use for sign-up operations.
     */
    private readonly signUpClient: SignUpClient;

    /*
     * The client to use for reset password operations.
     */
    private readonly resetPasswordClient: ResetPasswordClient;

    /*
     * The client to use for token operations.
     */
    private readonly tokenClient: CustomAuthTokenClient;

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
        this.tokenClient = interactionClientFactory.create(CustomAuthTokenClient);
    }

    /*
     * Gets the current account from the cache.
     * @param getAccountInputs - Inputs for getting the current cached account
     * @returns - A promise that resolves to GetAccountResult
     */
    getCurrentAccount(getAccountInputs?: GetAccountInputs): GetAccountResult {
        try {
            const correlationId = this.getCorrelationId(getAccountInputs);

            this.logger.info("Getting current account data.");

            let account: AccountInfo | null = null;

            if (!getAccountInputs?.username) {
                // No username provided, get the first account from cache.
                this.logger.info("No username provided. Getting the first account from cache.");

                const allAccounts = this.getAllAccounts();

                if (allAccounts.length > 0) {
                    if (allAccounts.length !== 1) {
                        this.logger.warning(
                            "Multiple accounts found in cache. This is not supported in the Native Auth scenario.",
                        );
                    }

                    account = allAccounts[0];
                }
            } else {
                // Username provided, get the account by username.
                this.logger.info("Username provided. Getting the account by username.");

                account = this.getAccountByUsername(getAccountInputs.username);
            }

            if (account) {
                this.logger.info("Account data found.");

                return new GetAccountResult(
                    new CustomAuthAccountData(account, this.customAuthConfig, this.tokenClient, correlationId),
                );
            }

            throw new GetCurrentAccountError(NoSignedInAccountFound, "No signed-in account found.", correlationId);
        } catch (error) {
            this.logger.error(`An error occurred during getting current account: ${error}`);

            return GetAccountResult.createWithError(error);
        }
    }

    /*
     * Signs the user in.
     * @param signInInputs - Inputs for signing in the user.
     * @returns The result of the operation.
     */
    async signIn(signInInputs: SignInInputs): Promise<SignInResult> {
        try {
            ArgumentValidator.ensureArgumentIsNotNullOrUndefined("signInInputs", signInInputs);

            const correlationId = this.getCorrelationId(signInInputs);

            this.ensureUsernameValid("signInInputs.username", signInInputs.username, correlationId);
            this.ensureUserNotSignedIn(signInInputs.username, correlationId);

            // start the signin flow
            const signInStartParams: SignInStartParams = {
                clientId: this.customAuthConfig.auth.clientId,
                correlationId: correlationId,
                challengeType: this.customAuthConfig.customAuth.challengeTypes ?? [],
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
                        this.tokenClient,
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
                            this.tokenClient,
                            signInInputs.username,
                            signInInputs.scopes ?? [],
                        ),
                    );
                }

                this.logger.info("Submitting password for sign-in.");

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

                this.logger.info("Sign-in flow completed.");

                const accountInfo = new CustomAuthAccountData(
                    completedResult.authenticationResult.account,
                    this.customAuthConfig,
                    this.tokenClient,
                    correlationId,
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
        try {
            ArgumentValidator.ensureArgumentIsNotNullOrUndefined("signUpInputs", signUpInputs);

            const correlationId = this.getCorrelationId(signUpInputs);

            this.ensureUsernameValid("signUpInputs.username", signUpInputs.username, correlationId);
            this.ensureUserNotSignedIn(signUpInputs.username, correlationId);

            this.logger.info(
                `Starting sign-up flow${
                    !!signUpInputs.password
                        ? ` with ${!!signUpInputs.attributes ? "password and attributes" : "password"}`
                        : ""
                }.`,
            );

            const startResult = await this.signUpClient.start({
                clientId: this.customAuthConfig.auth.clientId,
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
                        this.tokenClient,
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
                        this.tokenClient,
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
        try {
            ArgumentValidator.ensureArgumentIsNotNullOrUndefined("resetPasswordInputs", resetPasswordInputs);

            const correlationId = this.getCorrelationId(resetPasswordInputs);

            this.ensureUsernameValid("resetPasswordInputs.username", resetPasswordInputs.username, correlationId);
            this.ensureUserNotSignedIn(resetPasswordInputs.username, correlationId);

            this.logger.info("Starting password-reset flow.");

            const startResult = await this.resetPasswordClient.start({
                clientId: this.customAuthConfig.auth.clientId,
                correlationId: correlationId,
                challengeType: this.customAuthConfig.customAuth.challengeTypes ?? [],
                username: resetPasswordInputs.username,
            });

            this.logger.info("Password-reset flow started.");

            return new ResetPasswordStartResult(
                new ResetPasswordCodeRequired(
                    startResult.correlationId,
                    startResult.continuationToken,
                    this.logger,
                    this.customAuthConfig,
                    this.resetPasswordClient,
                    this.signInClient,
                    this.tokenClient,
                    resetPasswordInputs.username,
                    startResult.codeLength,
                ),
            );
        } catch (error) {
            this.logger.error(`An error occurred during starting reset-password: ${error}`);

            return ResetPasswordStartResult.createWithError(error);
        }
    }

    private getCorrelationId(actionInputs: CustomAuthActionInputs | undefined): string {
        return actionInputs?.correlationId || this.browserCrypto.createNewGuid();
    }

    private isUsernameValid(username: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !!username && emailRegex.test(username);
    }

    private ensureUsernameValid(usernameParamName: string, username: string, correlationId: string): void {
        if (!this.isUsernameValid(username)) {
            this.logger.error("Invalid username is provided.");

            throw new InvalidArgumentError(usernameParamName, correlationId);
        }
    }

    private ensureUserNotSignedIn(username: string, correlationId: string): void {
        const account = this.getCurrentAccount({
            username: username,
            correlationId: correlationId,
        });

        if (account && !!account.data) {
            this.logger.error("User has already signed in.");

            throw new UserAlreadySignedInError(correlationId);
        }
    }
}
