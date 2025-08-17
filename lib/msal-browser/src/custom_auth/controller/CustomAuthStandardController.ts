/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { GetAccountResult } from "../get_account/auth_flow/result/GetAccountResult.js";
import { SignInResult } from "../sign_in/auth_flow/result/SignInResult.js";
import { SignUpResult } from "../sign_up/auth_flow/result/SignUpResult.js";
import {
    SignInStartParams,
    SignInSubmitPasswordParams,
} from "../sign_in/interaction_client/parameter/SignInParams.js";
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
    SIGN_IN_CODE_SEND_RESULT_TYPE,
    SIGN_IN_PASSWORD_REQUIRED_RESULT_TYPE,
} from "../sign_in/interaction_client/result/SignInActionResult.js";
import { SignUpClient } from "../sign_up/interaction_client/SignUpClient.js";
import { CustomAuthInterationClientFactory } from "../core/interaction_client/CustomAuthInterationClientFactory.js";
import {
    SIGN_UP_CODE_REQUIRED_RESULT_TYPE,
    SIGN_UP_PASSWORD_REQUIRED_RESULT_TYPE,
} from "../sign_up/interaction_client/result/SignUpActionResult.js";
import { ICustomAuthApiClient } from "../core/network_client/custom_auth_api/ICustomAuthApiClient.js";
import { CustomAuthApiClient } from "../core/network_client/custom_auth_api/CustomAuthApiClient.js";
import { FetchHttpClient } from "../core/network_client/http_client/FetchHttpClient.js";
import { ResetPasswordClient } from "../reset_password/interaction_client/ResetPasswordClient.js";
import { NoCachedAccountFoundError } from "../core/error/NoCachedAccountFoundError.js";
import * as ArgumentValidator from "../core/utils/ArgumentValidator.js";
import { UserAlreadySignedInError } from "../core/error/UserAlreadySignedInError.js";
import { CustomAuthSilentCacheClient } from "../get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { UnsupportedEnvironmentError } from "../core/error/UnsupportedEnvironmentError.js";
import { SignInCodeRequiredState } from "../sign_in/auth_flow/state/SignInCodeRequiredState.js";
import { SignInPasswordRequiredState } from "../sign_in/auth_flow/state/SignInPasswordRequiredState.js";
import { SignInCompletedState } from "../sign_in/auth_flow/state/SignInCompletedState.js";
import { SignUpCodeRequiredState } from "../sign_up/auth_flow/state/SignUpCodeRequiredState.js";
import { SignUpPasswordRequiredState } from "../sign_up/auth_flow/state/SignUpPasswordRequiredState.js";
import { ResetPasswordCodeRequiredState } from "../reset_password/auth_flow/state/ResetPasswordCodeRequiredState.js";
import { StandardController } from "../../controllers/StandardController.js";

/*
 * Controller for standard native auth operations.
 */
export class CustomAuthStandardController
    extends StandardController
    implements ICustomAuthStandardController
{
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
    constructor(
        operatingContext: CustomAuthOperatingContext,
        customAuthApiClient?: ICustomAuthApiClient
    ) {
        super(operatingContext);

        if (!this.isBrowserFlag) {
            this.l.verbose(
                "The SDK can only be used in a browser environment."
            );
            throw new UnsupportedEnvironmentError();
        }

        this.l = this.l.clone(
            DefaultPackageInfo.SKU,
            DefaultPackageInfo.VERSION
        );
        this.customAuthConfig = operatingContext.getCustomAuthConfig();

        this.authority = new CustomAuthAuthority(
            this.customAuthConfig.auth.authority,
            this.customAuthConfig,
            this.nc,
            this.bs,
            this.l,
            this.customAuthConfig.customAuth?.authApiProxyUrl
        );

        const interactionClientFactory = new CustomAuthInterationClientFactory(
            this.customAuthConfig,
            this.bs,
            this.bc,
            this.l,
            this.eh,
            this.navClient,
            this.pc,
            customAuthApiClient ??
                new CustomAuthApiClient(
                    this.authority.getCustomAuthApiDomain(),
                    this.customAuthConfig.auth.clientId,
                    new FetchHttpClient(this.l)
                ),
            this.authority
        );

        this.signInClient = interactionClientFactory.create(SignInClient);
        this.signUpClient = interactionClientFactory.create(SignUpClient);
        this.resetPasswordClient =
            interactionClientFactory.create(ResetPasswordClient);
        this.cacheClient = interactionClientFactory.create(
            CustomAuthSilentCacheClient
        );
    }

    /*
     * Gets the current account from the cache.
     * @param accountRetrievalInputs - Inputs for getting the current cached account
     * @returns {GetAccountResult} The account result
     */
    getCurrentAccount(
        accountRetrievalInputs?: AccountRetrievalInputs
    ): GetAccountResult {
        const correlationId = this.getCorrelationId(accountRetrievalInputs);
        try {
            this.l.verbose("Getting current account data.", correlationId);

            const account = this.cacheClient.getCurrentAccount(correlationId);

            if (account) {
                this.l.verbose("Account data found.", correlationId);

                return new GetAccountResult(
                    new CustomAuthAccountData(
                        account,
                        this.customAuthConfig,
                        this.cacheClient,
                        this.l,
                        correlationId
                    )
                );
            }

            throw new NoCachedAccountFoundError(correlationId);
        } catch (error) {
            this.l.errorPii(
                `An error occurred during getting current account: ${error}`,
                correlationId
            );

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
            ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                "signInInputs",
                signInInputs,
                correlationId
            );

            ArgumentValidator.ensureArgumentIsNotEmptyString(
                "signInInputs.username",
                signInInputs.username,
                correlationId
            );
            this.ensureUserNotSignedIn(correlationId);

            if (signInInputs.claims) {
                ArgumentValidator.ensureArgumentIsJSONString(
                    "signInInputs.claims",
                    signInInputs.claims,
                    correlationId
                );
            }

            // start the signin flow
            const signInStartParams: SignInStartParams = {
                clientId: this.customAuthConfig.auth.clientId,
                correlationId: correlationId,
                challengeType:
                    this.customAuthConfig.customAuth.challengeTypes ?? [],
                username: signInInputs.username,
                password: signInInputs.password,
            };

            this.l.verbose(
                `Starting sign-in flow ${
                    !!signInInputs.password ? "with" : "without"
                } password.`,
                correlationId
            );

            const startResult = await this.signInClient.start(
                signInStartParams
            );

            this.l.verbose("Sign-in flow started.", correlationId);

            if (startResult.type === SIGN_IN_CODE_SEND_RESULT_TYPE) {
                // require code
                this.l.verbose(
                    "Code required for sign-in.",
                    correlationId
                );

                return new SignInResult(
                    new SignInCodeRequiredState({
                        correlationId: startResult.correlationId,
                        continuationToken: startResult.continuationToken,
                        logger: this.l,
                        config: this.customAuthConfig,
                        signInClient: this.signInClient,
                        cacheClient: this.cacheClient,
                        username: signInInputs.username,
                        codeLength: startResult.codeLength,
                        scopes: signInInputs.scopes ?? [],
                        claims: signInInputs.claims,
                    })
                );
            } else if (
                startResult.type === SIGN_IN_PASSWORD_REQUIRED_RESULT_TYPE
            ) {
                // require password
                this.l.verbose(
                    "Password required for sign-in.",
                    correlationId
                );

                if (!signInInputs.password) {
                    this.l.verbose(
                        "Password required but not provided. Returning password required state.",
                        correlationId
                    );

                    return new SignInResult(
                        new SignInPasswordRequiredState({
                            correlationId: startResult.correlationId,
                            continuationToken: startResult.continuationToken,
                            logger: this.l,
                            config: this.customAuthConfig,
                            signInClient: this.signInClient,
                            cacheClient: this.cacheClient,
                            username: signInInputs.username,
                            scopes: signInInputs.scopes ?? [],
                            claims: signInInputs.claims,
                        })
                    );
                }

                this.l.verbose(
                    "Submitting password for sign-in.",
                    correlationId
                );

                // if the password is provided, then try to get token silently.
                const submitPasswordParams: SignInSubmitPasswordParams = {
                    clientId: this.customAuthConfig.auth.clientId,
                    correlationId: correlationId,
                    challengeType:
                        this.customAuthConfig.customAuth.challengeTypes ?? [],
                    scopes: signInInputs.scopes ?? [],
                    continuationToken: startResult.continuationToken,
                    password: signInInputs.password,
                    username: signInInputs.username,
                    claims: signInInputs.claims,
                };

                const completedResult = await this.signInClient.submitPassword(
                    submitPasswordParams
                );

                this.l.verbose("Sign-in flow completed.", correlationId);

                const accountInfo = new CustomAuthAccountData(
                    completedResult.authenticationResult.account,
                    this.customAuthConfig,
                    this.cacheClient,
                    this.l,
                    correlationId
                );

                return new SignInResult(
                    new SignInCompletedState(),
                    accountInfo
                );
            }

            this.l.error(
                "Unexpected sign-in result type. Returning error.",
                correlationId
            );

            throw new UnexpectedError(
                "Unknow sign-in result type",
                correlationId
            );
        } catch (error) {
            this.l.errorPii(
                `An error occurred during starting sign-in: ${error}`,
                correlationId
            );

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
            ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                "signUpInputs",
                signUpInputs,
                correlationId
            );

            ArgumentValidator.ensureArgumentIsNotEmptyString(
                "signUpInputs.username",
                signUpInputs.username,
                correlationId
            );
            this.ensureUserNotSignedIn(correlationId);

            this.l.verbose(
                `Starting sign-up flow${
                    !!signUpInputs.password
                        ? ` with ${
                              !!signUpInputs.attributes
                                  ? "password and attributes"
                                  : "password"
                          }`
                        : ""
                }.`,
                correlationId
            );

            const startResult = await this.signUpClient.start({
                clientId: this.customAuthConfig.auth.clientId,
                correlationId: correlationId,
                challengeType:
                    this.customAuthConfig.customAuth.challengeTypes ?? [],
                username: signUpInputs.username,
                password: signUpInputs.password,
                attributes: signUpInputs.attributes,
            });

            this.l.verbose("Sign-up flow started.", correlationId);

            if (startResult.type === SIGN_UP_CODE_REQUIRED_RESULT_TYPE) {
                // Code required
                this.l.verbose(
                    "Code required for sign-up.",
                    correlationId
                );

                return new SignUpResult(
                    new SignUpCodeRequiredState({
                        correlationId: startResult.correlationId,
                        continuationToken: startResult.continuationToken,
                        logger: this.l,
                        config: this.customAuthConfig,
                        signInClient: this.signInClient,
                        signUpClient: this.signUpClient,
                        cacheClient: this.cacheClient,
                        username: signUpInputs.username,
                        codeLength: startResult.codeLength,
                        codeResendInterval: startResult.interval,
                    })
                );
            } else if (
                startResult.type === SIGN_UP_PASSWORD_REQUIRED_RESULT_TYPE
            ) {
                // Password required
                this.l.verbose(
                    "Password required for sign-up.",
                    correlationId
                );

                return new SignUpResult(
                    new SignUpPasswordRequiredState({
                        correlationId: startResult.correlationId,
                        continuationToken: startResult.continuationToken,
                        logger: this.l,
                        config: this.customAuthConfig,
                        signInClient: this.signInClient,
                        signUpClient: this.signUpClient,
                        cacheClient: this.cacheClient,
                        username: signUpInputs.username,
                    })
                );
            }

            this.l.error(
                "Unexpected sign-up result type. Returning error.",
                correlationId
            );

            throw new UnexpectedError(
                "Unknown sign-up result type",
                correlationId
            );
        } catch (error) {
            this.l.errorPii(
                `An error occurred during starting sign-up: ${error}`,
                correlationId
            );

            return SignUpResult.createWithError(error);
        }
    }

    /*
     * Resets the user's password.
     * @param resetPasswordInputs - Inputs for resetting the user's password.
     * @returns {Promise<ResetPasswordStartResult>} The result of the operation.
     */
    async resetPassword(
        resetPasswordInputs: ResetPasswordInputs
    ): Promise<ResetPasswordStartResult> {
        const correlationId = this.getCorrelationId(resetPasswordInputs);

        try {
            ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                "resetPasswordInputs",
                resetPasswordInputs,
                correlationId
            );

            ArgumentValidator.ensureArgumentIsNotEmptyString(
                "resetPasswordInputs.username",
                resetPasswordInputs.username,
                correlationId
            );
            this.ensureUserNotSignedIn(correlationId);

            this.l.verbose("Starting password-reset flow.", correlationId);

            const startResult = await this.resetPasswordClient.start({
                clientId: this.customAuthConfig.auth.clientId,
                correlationId: correlationId,
                challengeType:
                    this.customAuthConfig.customAuth.challengeTypes ?? [],
                username: resetPasswordInputs.username,
            });

            this.l.verbose("Password-reset flow started.", correlationId);

            return new ResetPasswordStartResult(
                new ResetPasswordCodeRequiredState({
                    correlationId: startResult.correlationId,
                    continuationToken: startResult.continuationToken,
                    logger: this.l,
                    config: this.customAuthConfig,
                    signInClient: this.signInClient,
                    resetPasswordClient: this.resetPasswordClient,
                    cacheClient: this.cacheClient,
                    username: resetPasswordInputs.username,
                    codeLength: startResult.codeLength,
                })
            );
        } catch (error) {
            this.l.errorPii(
                `An error occurred during starting reset-password: ${error}`,
                correlationId
            );

            return ResetPasswordStartResult.createWithError(error);
        }
    }

    private getCorrelationId(
        actionInputs: CustomAuthActionInputs | undefined
    ): string {
        return (
            actionInputs?.correlationId || this.bc.createNewGuid()
        );
    }

    private ensureUserNotSignedIn(correlationId: string): void {
        const account = this.getCurrentAccount({
            correlationId: correlationId,
        });

        if (account && !!account.data) {
            this.l.error("User has already signed in.", correlationId);

            throw new UserAlreadySignedInError(correlationId);
        }
    }
}
