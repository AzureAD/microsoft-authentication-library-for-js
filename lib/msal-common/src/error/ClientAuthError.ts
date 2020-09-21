/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthError } from "./AuthError";
import { IdToken } from "../account/IdToken";
import { ScopeSet } from "../request/ScopeSet";

/**
 * ClientAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const ClientAuthErrorMessage = {
    clientInfoDecodingError: {
        code: "client_info_decoding_error",
        desc: "The client info could not be parsed/decoded correctly. Please review the trace to determine the root cause."
    },
    clientInfoEmptyError: {
        code: "client_info_empty_error",
        desc: "The client info was empty. Please review the trace to determine the root cause."
    },
    idTokenParsingError: {
        code: "id_token_parsing_error",
        desc: "ID token cannot be parsed. Please review stack trace to determine root cause."
    },
    nullOrEmptyIdToken: {
        code: "null_or_empty_id_token",
        desc: "The idToken is null or empty. Please review the trace to determine the root cause."
    },
    endpointResolutionError: {
        code: "endpoints_resolution_error",
        desc: "Error: could not resolve endpoints. Please check network and try again."
    },
    invalidAuthorityType: {
        code: "invalid_authority_type",
        desc: "The given authority is not a valid type of authority supported by MSAL. Please review the trace to determine the root cause."
    },
    hashNotDeserialized: {
        code: "hash_not_deserialized",
        desc: "The hash parameters could not be deserialized. Please review the trace to determine the root cause."
    },
    blankGuidGenerated: {
        code: "blank_guid_generated",
        desc: "The guid generated was blank. Please review the trace to determine the root cause."
    },
    invalidStateError: {
        code: "invalid_state",
        desc: "State was not the expected format. Please check the logs to determine whether the request was sent using ProtocolUtils.setRequestState()."
    },
    stateMismatchError: {
        code: "state_mismatch",
        desc: "State mismatch error. Please check your network. Continued requests may cause cache overflow."
    },
    nonceMismatchError: {
        code: "nonce_mismatch",
        desc: "Nonce mismatch error. This may be caused by a race condition in concurrent requests."
    },
    accountMismatchError: {
        code: "account_mismatch",
        desc: "The cached account and account which made the token request do not match."
    },
    invalidIdToken: {
        code: "invalid_id_token",
        desc: "Invalid ID token format."
    },
    noTokensFoundError: {
        code: "no_tokens_found",
        desc: "No tokens were found for the given scopes, and no authorization code was passed to acquireToken. You must retrieve an authorization code before making a call to acquireToken()."
    },
    cacheParseError: {
        code: "cache_parse_error",
        desc: "Could not parse cache key."
    },
    userLoginRequiredError: {
        code: "user_login_error",
        desc: "User login is required."
    },
    multipleMatchingTokens: {
        code: "multiple_matching_tokens",
        desc: "The cache contains multiple tokens satisfying the requirements. " +
            "Call AcquireToken again providing more requirements such as authority or account."
    },
    multipleMatchingAccounts: {
        code: "multiple_matching_accounts",
        desc: "The cache contains multiple accounts satisfying the given parameters. Please pass more info to obtain the correct account"
    },
    tokenRequestCannotBeMade: {
        code: "request_cannot_be_made",
        desc: "Token request cannot be made without authorization code or refresh token."
    },
    appendEmptyScopeError: {
        code: "cannot_append_empty_scope",
        desc: "Cannot append null or empty scope to ScopeSet. Please check the stack trace for more info."
    },
    removeEmptyScopeError: {
        code: "cannot_remove_empty_scope",
        desc: "Cannot remove null or empty scope from ScopeSet. Please check the stack trace for more info."
    },
    appendScopeSetError: {
        code: "cannot_append_scopeset",
        desc: "Cannot append ScopeSet due to error."
    },
    emptyInputScopeSetError: {
        code: "empty_input_scopeset",
        desc: "Empty input ScopeSet cannot be processed."
    },
    DeviceCodePollingCancelled: {
        code: "device_code_polling_cancelled",
        desc: "Caller has cancelled token endpoint polling during device code flow by setting DeviceCodeRequest.cancel = true."
    },
    DeviceCodeExpired: {
        code: "device_code_expired",
        desc: "Device code is expired."
    },
    NoAccountInSilentRequest: {
        code: "no_account_in_silent_request",
        desc: "Please pass an account object, silent flow is not supported without account information"
    },
    invalidCacheRecord: {
        code: "invalid_cache_record",
        desc: "Cache record object was null or undefined."
    },
    invalidCacheEnvironment: {
        code: "invalid_cache_environment",
        desc: "Invalid environment when attempting to create cache entry"
    },
    noAccountFound: {
        code: "no_account_found",
        desc: "No account found in cache for given key."
    },
    CachePluginError: {
        code: "no cache plugin set on CacheManager",
        desc: "ICachePlugin needs to be set before using readFromStorage or writeFromStorage"
    },
    noCryptoObj: {
        code: "no_crypto_object",
        desc: "No crypto object detected. This is required for the following operation: "
    },
    invalidCacheType: {
        code: "invalid_cache_type",
        desc: "Invalid cache type"
    },
    unexpectedAccountType: {
        code: "unexpected_account_type",
        desc: "Unexpected account type."
    },
    unexpectedCredentialType: {
        code: "unexpected_credential_type",
        desc: "Unexpected credential type."
    },
    invalidAssertion: {
        code: "invalid_assertion",
        desc: "Client assertion must meet requirements described in https://tools.ietf.org/html/rfc7515"
    },
    invalidClientCredential: {
        code: "invalid_client_credential",
        desc: "Client credential (secret, certificate, or assertion) must not be empty when creating a confidential client. An application should at most have one credential"
    },
    tokenRefreshRequired: {
        code: "token_refresh_required",
        desc: "Cannot return token from cache because it must be refreshed. This may be due to one of the following reasons: forceRefresh parameter is set to true, claims have been requested, there is no cached access token or it is expired."
    }
};

/**
 * Error thrown when there is an error in the client code running on the browser.
 */
export class ClientAuthError extends AuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ClientAuthError";

        Object.setPrototypeOf(this, ClientAuthError.prototype);
    }

    /**
     * Creates an error thrown when client info object doesn't decode correctly.
     * @param caughtError
     */
    static createClientInfoDecodingError(caughtError: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.clientInfoDecodingError.code,
            `${ClientAuthErrorMessage.clientInfoDecodingError.desc} Failed with error: ${caughtError}`);
    }

    /**
     * Creates an error thrown if the client info is empty.
     * @param rawClientInfo
     */
    static createClientInfoEmptyError(rawClientInfo: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.clientInfoEmptyError.code,
            `${ClientAuthErrorMessage.clientInfoEmptyError.desc} Given Object: ${rawClientInfo}`);
    }

    /**
     * Creates an error thrown when the id token extraction errors out.
     * @param err
     */
    static createIdTokenParsingError(caughtExtractionError: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.idTokenParsingError.code,
            `${ClientAuthErrorMessage.idTokenParsingError.desc} Failed with error: ${caughtExtractionError}`);
    }

    /**
     * Creates an error thrown when the id token string is null or empty.
     * @param invalidRawTokenString
     */
    static createIdTokenNullOrEmptyError(invalidRawTokenString: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.nullOrEmptyIdToken.code,
            `${ClientAuthErrorMessage.nullOrEmptyIdToken.desc} Raw ID Token Value: ${invalidRawTokenString}`);
    }

    /**
     * Creates an error thrown when the endpoint discovery doesn't complete correctly.
     */
    static createEndpointDiscoveryIncompleteError(errDetail: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.endpointResolutionError.code,
            `${ClientAuthErrorMessage.endpointResolutionError.desc} Detail: ${errDetail}`);
    }

    /**
     * Creates an error thrown if authority type is not valid.
     * @param invalidAuthorityError
     */
    static createInvalidAuthorityTypeError(givenUrl: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidAuthorityType.code,
            `${ClientAuthErrorMessage.invalidAuthorityType.desc} Given Url: ${givenUrl}`);
    }

    /**
     * Creates an error thrown when the hash cannot be deserialized.
     * @param invalidAuthorityError
     */
    static createHashNotDeserializedError(hashParamObj: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.hashNotDeserialized.code,
            `${ClientAuthErrorMessage.hashNotDeserialized.desc} Given Object: ${hashParamObj}`);
    }

    /**
     * Creates an error thrown when the state cannot be parsed.
     * @param invalidState 
     */
    static createInvalidStateError(invalidState: string, errorString?: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidStateError.code,
            `${ClientAuthErrorMessage.invalidStateError.desc} Invalid State: ${invalidState}, Root Err: ${errorString}`);
    }

    /**
     * Creates an error thrown when two states do not match.
     */
    static createStateMismatchError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.stateMismatchError.code,
            ClientAuthErrorMessage.stateMismatchError.desc);
    }

    /**
     * Creates an error thrown when the nonce does not match.
     */
    static createNonceMismatchError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.nonceMismatchError.code,
            ClientAuthErrorMessage.nonceMismatchError.desc);
    }

    /**
     * Creates an error thrown when the cached account and response account do not match.
     */
    static createAccountMismatchError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.accountMismatchError.code,
            ClientAuthErrorMessage.accountMismatchError.desc);
    }

    /**
     * Throws error if idToken is not correctly formed
     * @param idToken
     */
    static createInvalidIdTokenError(idToken: IdToken): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidIdToken.code,
            `${ClientAuthErrorMessage.invalidIdToken.desc} Given token: ${JSON.stringify(idToken)}`);
    }

    /**
     * Creates an error thrown when the authorization code required for a token request is null or empty.
     */
    static createNoTokensFoundError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.noTokensFoundError.code, ClientAuthErrorMessage.noTokensFoundError.desc);
    }

    /**
     * Creates an error in cache parsing.
     */
    static createCacheParseError(cacheKey: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.cacheParseError.code,
            `${ClientAuthErrorMessage.cacheParseError.desc} Cache key: ${cacheKey}`);
    }

    /**
     * Throws error when renewing token without login.
     */
    static createUserLoginRequiredError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.userLoginRequiredError.code,
            ClientAuthErrorMessage.userLoginRequiredError.desc);
    }

    /**
     * Throws error when multiple tokens are in cache for the given scope.
     * @param scope
     */
    static createMultipleMatchingTokensInCacheError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.multipleMatchingTokens.code,
            `${ClientAuthErrorMessage.multipleMatchingTokens.desc}.`);
    }

    /**
     * Throws error when multiple tokens are in cache for the given scope.
     * @param scope
     */
    static createMultipleMatchingAccountsInCacheError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.multipleMatchingAccounts.code,
            ClientAuthErrorMessage.multipleMatchingAccounts.desc);
    }

    /**
     * Throws error when no auth code or refresh token is given to ServerTokenRequestParameters.
     */
    static createTokenRequestCannotBeMadeError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.tokenRequestCannotBeMade.code, ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
    }

    /**
     * Throws error when attempting to append a null, undefined or empty scope to a set
     * @param givenScope
     */
    static createAppendEmptyScopeToSetError(givenScope: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.appendEmptyScopeError.code, `${ClientAuthErrorMessage.appendEmptyScopeError.desc} Given Scope: ${givenScope}`);
    }

    /**
     * Throws error when attempting to append a null, undefined or empty scope to a set
     * @param givenScope
     */
    static createRemoveEmptyScopeFromSetError(givenScope: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.removeEmptyScopeError.code, `${ClientAuthErrorMessage.removeEmptyScopeError.desc} Given Scope: ${givenScope}`);
    }

    /**
     * Throws error when attempting to append null or empty ScopeSet.
     * @param appendError
     */
    static createAppendScopeSetError(appendError: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.appendScopeSetError.code, `${ClientAuthErrorMessage.appendScopeSetError.desc} Detail Error: ${appendError}`);
    }

    /**
     * Throws error if ScopeSet is null or undefined.
     * @param givenScopeSet
     */
    static createEmptyInputScopeSetError(givenScopeSet: ScopeSet): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.emptyInputScopeSetError.code, `${ClientAuthErrorMessage.emptyInputScopeSetError.desc} Given ScopeSet: ${givenScopeSet}`);
    }

    /**
     * Throws error if user sets CancellationToken.cancel = true during polling of token endpoint during device code flow
     */
    static createDeviceCodeCancelledError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.DeviceCodePollingCancelled.code, `${ClientAuthErrorMessage.DeviceCodePollingCancelled.desc}`);
    }

    /**
     * Throws error if device code is expired
     */
    static createDeviceCodeExpiredError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.DeviceCodeExpired.code, `${ClientAuthErrorMessage.DeviceCodeExpired.desc}`);
    }

    /**
     * Throws error when silent requests are made without an account object
     */
    static createNoAccountInSilentRequestError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.NoAccountInSilentRequest.code, `${ClientAuthErrorMessage.NoAccountInSilentRequest.desc}`);
    }

    /**
     * Throws error when cache record is null or undefined.
     */
    static createNullOrUndefinedCacheRecord(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidCacheRecord.code, ClientAuthErrorMessage.invalidCacheRecord.desc);
    }

    /**
     * Throws error when provided environment is not part of the CloudDiscoveryMetadata object
     */
    static createInvalidCacheEnvironmentError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidCacheEnvironment.code, ClientAuthErrorMessage.invalidCacheEnvironment.desc);
    }

    /**
     * Throws error when account is not found in cache.
     */
    static createNoAccountFoundError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.noAccountFound.code, ClientAuthErrorMessage.noAccountFound.desc);
    }

    /**
     * Throws error if ICachePlugin not set on CacheManager.
     */
    static createCachePluginError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.CachePluginError.code, `${ClientAuthErrorMessage.CachePluginError.desc}`);
    }

    /**
     * Throws error if crypto object not found.
     * @param operationName 
     */
    static createNoCryptoObjectError(operationName: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.noCryptoObj.code, `${ClientAuthErrorMessage.noCryptoObj.desc}${operationName}`);
    }

    /**
     * Throws error if cache type is invalid.
     */
    static createInvalidCacheTypeError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidCacheType.code, `${ClientAuthErrorMessage.invalidCacheType.desc}`);
    }

    /**
     * Throws error if unexpected account type.
     */
    static createUnexpectedAccountTypeError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.unexpectedAccountType.code, `${ClientAuthErrorMessage.unexpectedAccountType.desc}`);
    }

    /**
     * Throws error if unexpected credential type.
     */
    static createUnexpectedCredentialTypeError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.unexpectedCredentialType.code, `${ClientAuthErrorMessage.unexpectedCredentialType.desc}`);
    }

    /**
     * Throws error if client assertion is not valid.
     */
    static createInvalidAssertionError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidAssertion.code, `${ClientAuthErrorMessage.invalidAssertion.desc}`);
    }

    /**
     * Throws error if client assertion is not valid.
     */
    static createInvalidCredentialError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidClientCredential.code, `${ClientAuthErrorMessage.invalidClientCredential.desc}`);
    }

    /**
     * Throws error if token cannot be retrieved from cache due to refresh being required.
     */
    static createRefreshRequiredError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.tokenRefreshRequired.code, ClientAuthErrorMessage.tokenRefreshRequired.desc);
    }
}
