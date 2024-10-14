/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    AccountInfo,
    AuthenticationResult,
    AuthenticationScheme,
    ClientAuthErrorCodes,
    ClientConfigurationErrorCodes,
    Constants,
    createClientAuthError,
    createClientConfigurationError,
    IdTokenClaims,
    INativeBrokerPlugin,
    InteractionRequiredAuthError,
    Logger,
    LoggerOptions,
    NativeRequest,
    NativeSignOutRequest,
    PromptValue,
    ServerError,
    ServerTelemetryManager,
} from "@azure/msal-common/node";
import {
    msalNodeRuntime,
    Account,
    AuthParameters,
    AuthResult,
    ErrorStatus,
    MsalRuntimeError,
    ReadAccountResult,
    DiscoverAccountsResult,
    SignOutResult,
    LogLevel as MsalRuntimeLogLevel,
} from "@azure/msal-node-runtime";
import { ErrorCodes } from "../utils/Constants.js";
import { NativeAuthError } from "../error/NativeAuthError.js";
import { version, name } from "../packageMetadata.js";

export class NativeBrokerPlugin implements INativeBrokerPlugin {
    private logger: Logger;
    isBrokerAvailable: boolean;

    constructor() {
        const defaultLoggerOptions: LoggerOptions = {
            loggerCallback: (): void => {
                // Empty logger callback
            },
            piiLoggingEnabled: false,
        };
        this.logger = new Logger(defaultLoggerOptions, name, version); // Default logger
        this.isBrokerAvailable = msalNodeRuntime.StartupError ? false : true;
    }

    setLogger(loggerOptions: LoggerOptions): void {
        this.logger = new Logger(loggerOptions, name, version);
        const logCallback = (
            message: string,
            logLevel: MsalRuntimeLogLevel,
            containsPii: boolean
        ) => {
            switch (logLevel) {
                case MsalRuntimeLogLevel.Trace:
                    if (containsPii) {
                        this.logger.tracePii(message);
                    } else {
                        this.logger.trace(message);
                    }
                    break;
                case MsalRuntimeLogLevel.Debug:
                    if (containsPii) {
                        this.logger.tracePii(message);
                    } else {
                        this.logger.trace(message);
                    }
                    break;
                case MsalRuntimeLogLevel.Info:
                    if (containsPii) {
                        this.logger.infoPii(message);
                    } else {
                        this.logger.info(message);
                    }
                    break;
                case MsalRuntimeLogLevel.Warning:
                    if (containsPii) {
                        this.logger.warningPii(message);
                    } else {
                        this.logger.warning(message);
                    }
                    break;
                case MsalRuntimeLogLevel.Error:
                    if (containsPii) {
                        this.logger.errorPii(message);
                    } else {
                        this.logger.error(message);
                    }
                    break;
                case MsalRuntimeLogLevel.Fatal:
                    if (containsPii) {
                        this.logger.errorPii(message);
                    } else {
                        this.logger.error(message);
                    }
                    break;
                default:
                    if (containsPii) {
                        this.logger.infoPii(message);
                    } else {
                        this.logger.info(message);
                    }
                    break;
            }
        };
        try {
            msalNodeRuntime.RegisterLogger(
                logCallback,
                loggerOptions.piiLoggingEnabled || false
            );
        } catch (e) {
            const wrappedError = this.wrapError(e);
            if (wrappedError) {
                throw wrappedError;
            }
        }
    }

    async getAccountById(
        accountId: string,
        correlationId: string
    ): Promise<AccountInfo> {
        this.logger.trace(
            "NativeBrokerPlugin - getAccountById called",
            correlationId
        );
        const readAccountResult = await this.readAccountById(
            accountId,
            correlationId
        );
        return this.generateAccountInfo(readAccountResult.account);
    }

    async getAllAccounts(
        clientId: string,
        correlationId: string
    ): Promise<AccountInfo[]> {
        this.logger.trace(
            "NativeBrokerPlugin - getAllAccounts called",
            correlationId
        );
        return new Promise((resolve, reject) => {
            const resultCallback = (result: DiscoverAccountsResult) => {
                try {
                    result.CheckError();
                } catch (e) {
                    const wrappedError = this.wrapError(e);
                    if (wrappedError) {
                        reject(wrappedError);
                        return;
                    }
                }

                const accountInfoResult: AccountInfo[] = [];
                result.accounts.forEach((account: Account) => {
                    accountInfoResult.push(this.generateAccountInfo(account));
                });
                resolve(accountInfoResult);
            };

            try {
                msalNodeRuntime.DiscoverAccountsAsync(
                    clientId,
                    correlationId,
                    resultCallback
                );
            } catch (e) {
                const wrappedError = this.wrapError(e);
                if (wrappedError) {
                    reject(wrappedError);
                }
            }
        });
    }

    async acquireTokenSilent(
        request: NativeRequest
    ): Promise<AuthenticationResult> {
        this.logger.trace(
            "NativeBrokerPlugin - acquireTokenSilent called",
            request.correlationId
        );
        const authParams = this.generateRequestParameters(request);
        const account = await this.getAccount(request);

        return new Promise(
            (resolve: (value: AuthenticationResult) => void, reject) => {
                const resultCallback = (result: AuthResult) => {
                    try {
                        result.CheckError();
                    } catch (e) {
                        const wrappedError = this.wrapError(e);
                        if (wrappedError) {
                            reject(wrappedError);
                            return;
                        }
                    }
                    const authenticationResult = this.getAuthenticationResult(
                        request,
                        result
                    );
                    resolve(authenticationResult);
                };

                try {
                    if (account) {
                        msalNodeRuntime.AcquireTokenSilentlyAsync(
                            authParams,
                            request.correlationId,
                            account,
                            resultCallback
                        );
                    } else {
                        msalNodeRuntime.SignInSilentlyAsync(
                            authParams,
                            request.correlationId,
                            resultCallback
                        );
                    }
                } catch (e) {
                    const wrappedError = this.wrapError(e);
                    if (wrappedError) {
                        reject(wrappedError);
                    }
                }
            }
        );
    }

    async acquireTokenInteractive(
        request: NativeRequest,
        providedWindowHandle?: Buffer
    ): Promise<AuthenticationResult> {
        this.logger.trace(
            "NativeBrokerPlugin - acquireTokenInteractive called",
            request.correlationId
        );
        const authParams = this.generateRequestParameters(request);
        const account = await this.getAccount(request);
        const windowHandle = providedWindowHandle || Buffer.from([0]);

        return new Promise(
            (resolve: (value: AuthenticationResult) => void, reject) => {
                const resultCallback = (result: AuthResult) => {
                    try {
                        result.CheckError();
                    } catch (e) {
                        const wrappedError = this.wrapError(e);
                        if (wrappedError) {
                            reject(wrappedError);
                            return;
                        }
                    }
                    const authenticationResult = this.getAuthenticationResult(
                        request,
                        result
                    );
                    resolve(authenticationResult);
                };

                try {
                    switch (request.prompt) {
                        case PromptValue.LOGIN:
                        case PromptValue.SELECT_ACCOUNT:
                        case PromptValue.CREATE:
                            this.logger.info(
                                "Calling native interop SignInInteractively API",
                                request.correlationId
                            );
                            const loginHint =
                                request.loginHint || Constants.EMPTY_STRING;
                            msalNodeRuntime.SignInInteractivelyAsync(
                                windowHandle,
                                authParams,
                                request.correlationId,
                                loginHint,
                                resultCallback
                            );
                            break;
                        case PromptValue.NONE:
                            if (account) {
                                this.logger.info(
                                    "Calling native interop AcquireTokenSilently API",
                                    request.correlationId
                                );
                                msalNodeRuntime.AcquireTokenSilentlyAsync(
                                    authParams,
                                    request.correlationId,
                                    account,
                                    resultCallback
                                );
                            } else {
                                this.logger.info(
                                    "Calling native interop SignInSilently API",
                                    request.correlationId
                                );
                                msalNodeRuntime.SignInSilentlyAsync(
                                    authParams,
                                    request.correlationId,
                                    resultCallback
                                );
                            }
                            break;
                        default:
                            if (account) {
                                this.logger.info(
                                    "Calling native interop AcquireTokenInteractively API",
                                    request.correlationId
                                );
                                msalNodeRuntime.AcquireTokenInteractivelyAsync(
                                    windowHandle,
                                    authParams,
                                    request.correlationId,
                                    account,
                                    resultCallback
                                );
                            } else {
                                this.logger.info(
                                    "Calling native interop SignIn API",
                                    request.correlationId
                                );
                                const loginHint =
                                    request.loginHint || Constants.EMPTY_STRING;
                                msalNodeRuntime.SignInAsync(
                                    windowHandle,
                                    authParams,
                                    request.correlationId,
                                    loginHint,
                                    resultCallback
                                );
                            }
                            break;
                    }
                } catch (e) {
                    const wrappedError = this.wrapError(e);
                    if (wrappedError) {
                        reject(wrappedError);
                    }
                }
            }
        );
    }

    async signOut(request: NativeSignOutRequest): Promise<void> {
        this.logger.trace(
            "NativeBrokerPlugin - signOut called",
            request.correlationId
        );

        const account = await this.getAccount(request);
        if (!account) {
            throw createClientAuthError(ClientAuthErrorCodes.noAccountFound);
        }

        return new Promise((resolve, reject) => {
            const resultCallback = (result: SignOutResult) => {
                try {
                    result.CheckError();
                } catch (e) {
                    const wrappedError = this.wrapError(e);
                    if (wrappedError) {
                        reject(wrappedError);
                        return;
                    }
                }
                resolve();
            };

            try {
                msalNodeRuntime.SignOutSilentlyAsync(
                    request.clientId,
                    request.correlationId,
                    account,
                    resultCallback
                );
            } catch (e) {
                const wrappedError = this.wrapError(e);
                if (wrappedError) {
                    reject(wrappedError);
                }
            }
        });
    }

    private async getAccount(
        request: NativeRequest | NativeSignOutRequest
    ): Promise<Account | null> {
        if (request.accountId) {
            const readAccountResult = await this.readAccountById(
                request.accountId,
                request.correlationId
            );
            return readAccountResult.account;
        }
        return null;
    }

    private async readAccountById(
        accountId: string,
        correlationId: string
    ): Promise<ReadAccountResult> {
        this.logger.trace(
            "NativeBrokerPlugin - readAccountById called",
            correlationId
        );

        return new Promise((resolve, reject) => {
            const resultCallback = (result: ReadAccountResult) => {
                try {
                    result.CheckError();
                } catch (e) {
                    const wrappedError = this.wrapError(e);
                    if (wrappedError) {
                        reject(wrappedError);
                        return;
                    }
                }
                resolve(result);
            };

            try {
                msalNodeRuntime.ReadAccountByIdAsync(
                    accountId,
                    correlationId,
                    resultCallback
                );
            } catch (e) {
                const wrappedError = this.wrapError(e);
                if (wrappedError) {
                    reject(wrappedError);
                }
            }
        });
    }

    private generateRequestParameters(request: NativeRequest): AuthParameters {
        this.logger.trace(
            "NativeBrokerPlugin - generateRequestParameters called",
            request.correlationId
        );
        const authParams = new msalNodeRuntime.AuthParameters();

        try {
            authParams.CreateAuthParameters(
                request.clientId,
                request.authority
            );
            authParams.SetRedirectUri(request.redirectUri);
            authParams.SetRequestedScopes(request.scopes.join(" "));

            if (request.claims) {
                authParams.SetDecodedClaims(request.claims);
            }

            if (request.authenticationScheme === AuthenticationScheme.POP) {
                if (
                    !request.resourceRequestMethod ||
                    !request.resourceRequestUri
                ) {
                    throw new Error(
                        "Authentication Scheme set to POP but one or more of the following parameters are missing: resourceRequestMethod, resourceRequestUri"
                    );
                }
                const resourceUrl = new URL(request.resourceRequestUri);
                authParams.SetPopParams(
                    request.resourceRequestMethod,
                    resourceUrl.host,
                    resourceUrl.pathname,
                    request.shrNonce || ""
                );
            }

            if (request.extraParameters) {
                Object.entries(request.extraParameters).forEach(
                    ([key, value]) => {
                        authParams.SetAdditionalParameter(key, value);
                    }
                );
            }

            const skus =
                request.extraParameters &&
                request.extraParameters[AADServerParamKeys.X_CLIENT_EXTRA_SKU]
                    ?.length
                    ? request.extraParameters[
                          AADServerParamKeys.X_CLIENT_EXTRA_SKU
                      ]
                    : "";
            authParams.SetAdditionalParameter(
                AADServerParamKeys.X_CLIENT_EXTRA_SKU,
                ServerTelemetryManager.makeExtraSkuString({
                    skus,
                    extensionName: "msal.node.ext",
                    extensionVersion: version,
                })
            );
        } catch (e) {
            const wrappedError = this.wrapError(e);
            if (wrappedError) {
                throw wrappedError;
            }
        }

        return authParams;
    }

    private getAuthenticationResult(
        request: NativeRequest,
        authResult: AuthResult
    ): AuthenticationResult {
        this.logger.trace(
            "NativeBrokerPlugin - getAuthenticationResult called",
            request.correlationId
        );

        let fromCache: boolean = false;
        try {
            const telemetryJSON = JSON.parse(authResult.telemetryData);
            fromCache = !!telemetryJSON["is_cache"];
        } catch (e) {
            this.logger.error(
                "NativeBrokerPlugin: getAuthenticationResult - Error parsing telemetry data. Could not determine if response came from cache.",
                request.correlationId
            );
        }

        let idTokenClaims: IdTokenClaims;
        try {
            idTokenClaims = JSON.parse(authResult.idToken);
        } catch (e) {
            throw new Error("Unable to parse idToken claims");
        }

        const accountInfo = this.generateAccountInfo(
            authResult.account,
            idTokenClaims
        );

        let accessToken;
        let tokenType;
        if (authResult.isPopAuthorization) {
            // Header includes 'pop ' prefix
            accessToken = authResult.authorizationHeader.split(" ")[1];
            tokenType = AuthenticationScheme.POP;
        } else {
            accessToken = authResult.accessToken;
            tokenType = AuthenticationScheme.BEARER;
        }

        const result: AuthenticationResult = {
            authority: request.authority,
            uniqueId: idTokenClaims.oid || idTokenClaims.sub || "",
            tenantId: idTokenClaims.tid || "",
            scopes: authResult.grantedScopes.split(" "),
            account: accountInfo,
            idToken: authResult.rawIdToken,
            idTokenClaims: idTokenClaims,
            accessToken: accessToken,
            fromCache: fromCache,
            expiresOn: new Date(authResult.expiresOn),
            tokenType: tokenType,
            correlationId: request.correlationId,
            fromNativeBroker: true,
        };
        return result;
    }

    private generateAccountInfo(
        account: Account,
        idTokenClaims?: IdTokenClaims
    ): AccountInfo {
        this.logger.trace("NativeBrokerPlugin - generateAccountInfo called");

        const accountInfo: AccountInfo = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            tenantId: account.realm,
            username: account.username,
            localAccountId: account.localAccountId,
            name: account.displayName,
            idTokenClaims: idTokenClaims,
            nativeAccountId: account.accountId,
        };
        return accountInfo;
    }

    private isMsalRuntimeError(result: Object): boolean {
        return (
            result.hasOwnProperty("errorCode") ||
            result.hasOwnProperty("errorStatus") ||
            result.hasOwnProperty("errorContext") ||
            result.hasOwnProperty("errorTag")
        );
    }

    private wrapError(error: unknown): NativeAuthError | Object | null {
        if (
            error &&
            typeof error === "object" &&
            this.isMsalRuntimeError(error)
        ) {
            const { errorCode, errorStatus, errorContext, errorTag } =
                error as MsalRuntimeError;
            switch (errorStatus) {
                case ErrorStatus.InteractionRequired:
                case ErrorStatus.AccountUnusable:
                    return new InteractionRequiredAuthError(
                        ErrorCodes.INTERATION_REQUIRED_ERROR_CODE,
                        errorContext
                    );
                case ErrorStatus.NoNetwork:
                case ErrorStatus.NetworkTemporarilyUnavailable:
                    return createClientAuthError(
                        ClientAuthErrorCodes.noNetworkConnectivity
                    );
                case ErrorStatus.ServerTemporarilyUnavailable:
                    return new ServerError(
                        ErrorCodes.SERVER_UNAVAILABLE,
                        errorContext
                    );
                case ErrorStatus.UserCanceled:
                    return createClientAuthError(
                        ClientAuthErrorCodes.userCanceled
                    );
                case ErrorStatus.AuthorityUntrusted:
                    return createClientConfigurationError(
                        ClientConfigurationErrorCodes.untrustedAuthority
                    );
                case ErrorStatus.UserSwitched:
                    // Not an error case, if there's customer demand we can surface this as a response property
                    return null;
                case ErrorStatus.AccountNotFound:
                    return createClientAuthError(
                        ClientAuthErrorCodes.noAccountFound
                    );
                default:
                    return new NativeAuthError(
                        ErrorStatus[errorStatus],
                        errorContext,
                        errorCode,
                        errorTag
                    );
            }
        }
        throw error;
    }
}
