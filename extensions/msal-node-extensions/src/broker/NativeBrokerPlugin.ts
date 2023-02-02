/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult, AuthenticationScheme, Constants, IdTokenClaims, INativeBrokerPlugin, Logger, LoggerOptions, NativeRequest, NativeSignOutRequest, PromptValue } from "@azure/msal-common";
import { msalNodeRuntime, Account, AuthParameters, AuthResult, ErrorStatus, MsalRuntimeError, ReadAccountResult, DiscoverAccountsResult, SignOutResult, LogLevel as MsalRuntimeLogLevel} from "@azure/msal-node-runtime";
import { NativeAuthError } from "../error/NativeAuthError";
import { version, name } from "../packageMetadata";

export class NativeBrokerPlugin implements INativeBrokerPlugin {
    private logger: Logger;
    isBrokerAvailable: boolean;
    
    constructor() {
        const defaultLoggerOptions: LoggerOptions = {
            loggerCallback: () => {},
            piiLoggingEnabled: false
        };
        this.logger = new Logger(defaultLoggerOptions, name, version); // Default logger
        this.isBrokerAvailable = msalNodeRuntime.StartupError ? false : true;
    }

    setLogger(loggerOptions: LoggerOptions): void {
        this.logger = new Logger(loggerOptions, name, version);
        const logCallback = (message: string, logLevel: MsalRuntimeLogLevel, containsPii: boolean) => {
            switch(logLevel) {
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
            msalNodeRuntime.RegisterLogger(logCallback, loggerOptions.piiLoggingEnabled);
        } catch (e) {            
            throw this.wrapError(e);
        }
    }

    async getAccountById(accountId: string, correlationId: string): Promise<AccountInfo> {
        this.logger.trace("NativeBrokerPlugin - getAccountById called", correlationId);
        const readAccountResult = await this.readAccountById(accountId, correlationId);
        return this.generateAccountInfo(readAccountResult.account);
    }

    async getAllAccounts(clientId:string, correlationId: string): Promise<AccountInfo[]> {
        this.logger.trace("NativeBrokerPlugin - getAllAccounts called", correlationId);
        return new Promise((resolve, reject) => {
            const resultCallback = (result: DiscoverAccountsResult) => {
                try {
                    result.CheckError();
                } catch (e) {
                    reject(this.wrapError(e));
                    return;
                }
                const accountInfoResult = [];
                result.accounts.forEach((account: Account) => {
                    accountInfoResult.push(this.generateAccountInfo(account));
                });
                resolve(accountInfoResult);
            };

            try {
                msalNodeRuntime.DiscoverAccountsAsync(clientId, correlationId, resultCallback);
            } catch (e) {
                reject(this.wrapError(e));
            }
        });
    }

    async acquireTokenSilent(request: NativeRequest): Promise<AuthenticationResult> {
        this.logger.trace("NativeBrokerPlugin - acquireTokenSilent called", request.correlationId);
        const authParams = this.generateRequestParameters(request);
        let account: Account;
        if (request.accountId) {
            const readAccountResult = await this.readAccountById(request.accountId, request.correlationId);
            account = readAccountResult.account;
        }

        return new Promise((resolve: (value: AuthenticationResult) => void, reject) => {
            const resultCallback = (result: AuthResult) => {
                try {
                    result.CheckError();
                } catch (e) {
                    reject(this.wrapError(e));
                    return;
                }
                const authenticationResult = this.getAuthenticationResult(request, result);
                resolve(authenticationResult);
            };

            try {
                if (account) {
                    msalNodeRuntime.AcquireTokenSilentlyAsync(authParams, request.correlationId, account, resultCallback);
                } else {
                    msalNodeRuntime.SignInSilentlyAsync(authParams, request.correlationId, resultCallback);
                }
            } catch (e) {
                reject(this.wrapError(e));
            }
        });
    }

    async acquireTokenInteractive(request: NativeRequest, windowHandle?: Buffer): Promise<AuthenticationResult> {
        this.logger.trace("NativeBrokerPlugin - acquireTokenInteractive called", request.correlationId);
        const authParams = this.generateRequestParameters(request);
        let account: Account;
        if (request.accountId) {
            const readAccountResult = await this.readAccountById(request.accountId, request.correlationId);
            account = readAccountResult.account;
        }

        return new Promise((resolve: (value: AuthenticationResult) => void, reject) => {
            const resultCallback = (result: AuthResult) => {
                try {
                    result.CheckError();
                } catch (e) {
                    reject(this.wrapError(e));
                    return;
                }
                const authenticationResult = this.getAuthenticationResult(request, result);
                resolve(authenticationResult);
            };

            try {
                switch (request.prompt) {
                    case PromptValue.LOGIN:
                    case PromptValue.SELECT_ACCOUNT:
                    case PromptValue.CREATE:
                        this.logger.info("Calling native interop SignInInteractively API", request.correlationId);
                        const loginHint = request.loginHint || Constants.EMPTY_STRING;
                        msalNodeRuntime.SignInInteractivelyAsync(windowHandle, authParams, request.correlationId, loginHint, resultCallback);
                        break;
                    case PromptValue.NONE:
                        if (account) {
                            this.logger.info("Calling native interop AcquireTokenSilently API", request.correlationId);
                            msalNodeRuntime.AcquireTokenSilentlyAsync(authParams, request.correlationId, account, resultCallback);
                        } else {
                            this.logger.info("Calling native interop SignInSilently API", request.correlationId);
                            msalNodeRuntime.SignInSilentlyAsync(authParams, request.correlationId, resultCallback);
                        }
                        break;
                    default:
                        if (account) {
                            this.logger.info("Calling native interop AcquireTokenInteractively API", request.correlationId);
                            msalNodeRuntime.AcquireTokenInteractivelyAsync(windowHandle, authParams, request.correlationId, account, resultCallback);
                        } else {
                            this.logger.info("Calling native interop SignIn API", request.correlationId);
                            const loginHint = request.loginHint || Constants.EMPTY_STRING;
                            msalNodeRuntime.SignInAsync(windowHandle, authParams, request.correlationId, loginHint, resultCallback);
                        }
                        break;
                }
            } catch (e) {
                reject(this.wrapError(e));
            }
        });
    }

    async signOut(request: NativeSignOutRequest): Promise<void> {
        this.logger.trace("NativeBrokerPlugin - signOut called", request.correlationId);

        const readAccountResult = await this.readAccountById(request.accountId, request.correlationId);
        const account = readAccountResult.account;

        return new Promise((resolve, reject) => {
            const resultCallback = (result: SignOutResult) => {
                try {
                    result.CheckError();
                } catch (e) {
                    reject(this.wrapError(e));
                    return;
                }
                resolve();
            };

            try {
                msalNodeRuntime.SignOutSilentlyAsync(request.clientId, request.correlationId, account, resultCallback);
            } catch (e) {
                reject(this.wrapError(e));
            }
        });
    }

    private async readAccountById(accountId: string, correlationId: string): Promise<ReadAccountResult> {
        this.logger.trace("NativeBrokerPlugin - readAccountById called", correlationId);

        return new Promise((resolve, reject) => {
            const resultCallback = (result: ReadAccountResult) => {
                try {
                    result.CheckError();
                } catch (e) {
                    reject(this.wrapError(e));
                    return;
                }
                resolve(result);
            };

            try {
                msalNodeRuntime.ReadAccountByIdAsync(accountId, correlationId, resultCallback);
            } catch (e) {
                reject(this.wrapError(e));
            }
        });
    }

    private generateRequestParameters(request: NativeRequest): AuthParameters {
        this.logger.trace("NativeBrokerPlugin - generateRequestParameters called", request.correlationId);
        const authParams = new msalNodeRuntime.AuthParameters();
        let errorResponse;
        errorResponse = authParams.CreateAuthParameters(request.clientId, request.authority);
        if (errorResponse && this.isMsalRuntimeError(errorResponse)) {
            throw this.wrapError(errorResponse);
        }
        errorResponse = authParams.SetRedirectUri(request.redirectUri);
        if (errorResponse && this.isMsalRuntimeError(errorResponse)) {
            throw this.wrapError(errorResponse);
        }
        errorResponse = authParams.SetRequestedScopes(request.scopes.join(" "));
        if (errorResponse && this.isMsalRuntimeError(errorResponse)) {
            throw this.wrapError(errorResponse);
        }

        if (request.claims) {
            errorResponse = authParams.SetDecodedClaims(request.claims);
            if (errorResponse && this.isMsalRuntimeError(errorResponse)) {
                throw this.wrapError(errorResponse);
            }
        }

        if (request.authenticationScheme === AuthenticationScheme.POP) {
            if (!request.resourceRequestMethod || !request.resourceRequestUri || !request.shrNonce) {
                throw new Error("Authentication Scheme set to POP but one or more of the following parameters are missing: resourceRequestMethod, resourceRequestUri, shrNonce");
            }
            const resourceUrl = new URL(request.resourceRequestUri);
            errorResponse = authParams.SetPopParams(request.resourceRequestMethod, resourceUrl.host, resourceUrl.pathname, request.shrNonce);
            if (errorResponse && this.isMsalRuntimeError(errorResponse)) {
                throw this.wrapError(errorResponse);
            }
        }
        
        if (request.extraParameters) {
            Object.keys(request.extraParameters).forEach((key) => {
                errorResponse = authParams.SetAdditionalParameter(key, request.extraParameters[key]);
                if (errorResponse && this.isMsalRuntimeError(errorResponse)) {
                    throw this.wrapError(errorResponse);
                }
            });
        }

        return authParams;
    }

    private getAuthenticationResult(request: NativeRequest, authResult: AuthResult): AuthenticationResult {
        this.logger.trace("NativeBrokerPlugin - getAuthenticationResult called", request.correlationId);
        
        let fromCache: boolean;
        try {
            const telemetryJSON = JSON.parse(authResult.telemetryData);
            fromCache = !!telemetryJSON["is_cache"];
        } catch (e) {
            this.logger.error("NativeBrokerPlugin: getAuthenticationResult - Error parsing telemetry data. Could not determine if response came from cache.", request.correlationId);
        }

        let idTokenClaims: IdTokenClaims;
        try {
            idTokenClaims = JSON.parse(authResult.idToken);
        } catch (e) {
            throw new Error("Unable to parse idToken claims");
        }

        const accountInfo = this.generateAccountInfo(authResult.account, idTokenClaims);

        const result: AuthenticationResult = {
            authority: request.authority,
            uniqueId: idTokenClaims.oid || idTokenClaims.sub || "",
            tenantId: idTokenClaims.tid || "",
            scopes: authResult.grantedScopes.split(" "),
            account: accountInfo,
            idToken: authResult.rawIdToken,
            idTokenClaims: idTokenClaims,
            accessToken: authResult.accessToken,
            fromCache: fromCache,
            expiresOn: new Date(authResult.expiresOn * 1000),
            tokenType: authResult.isPopAuthorization ? AuthenticationScheme.POP : AuthenticationScheme.BEARER,
            correlationId: request.correlationId,
            fromNativeBroker: true
        };
        return result;
    }

    private generateAccountInfo(account: Account, idTokenClaims?: IdTokenClaims): AccountInfo {
        this.logger.trace("NativeBrokerPlugin - generateAccountInfo called");

        const accountInfo: AccountInfo = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            tenantId: account.realm,
            username: account.username,
            localAccountId: account.localAccountId,
            name: account.displayName,
            idTokenClaims: idTokenClaims,
            nativeAccountId: account.accountId
        };
        return accountInfo;
    }

    private isMsalRuntimeError(result: Object): boolean {
        return result.hasOwnProperty("errorCode") ||
               result.hasOwnProperty("errorStatus") ||
               result.hasOwnProperty("errorContext") ||
               result.hasOwnProperty("errorTag");
    }

    private wrapError(error: Object): NativeAuthError | Object {
        if (this.isMsalRuntimeError(error)) {
            const { errorCode, errorStatus, errorContext, errorTag } = error as MsalRuntimeError;
            return new NativeAuthError(ErrorStatus[errorStatus], errorContext, errorCode, errorTag);
        }

        return error;
    }
}
