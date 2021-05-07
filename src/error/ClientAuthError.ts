/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError";
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
    tokenParsingError: {
        code: "token_parsing_error",
        desc: "Token cannot be parsed. Please review stack trace to determine root cause."
    },
    nullOrEmptyToken: {
        code: "null_or_empty_token",
        desc: "The token is null or empty. Please review the trace to determine the root cause."
    },
    endpointResolutionError: {
        code: "endpoints_resolution_error",
        desc: "Error: could not resolve endpoints. Please check network and try again."
    },
    networkError: {
        code: "network_error",
        desc: "Network request failed. Please check network trace to determine root cause."
    },
    unableToGetOpenidConfigError: {
        code: "openid_config_error",
        desc: "Could not retrieve endpoints. Check your authority and verify the .well-known/openid-configuration endpoint returns the required endpoints."
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
    stateNotFoundError: {
        code: "state_not_found",
        desc: "State not found"
    },
    nonceMismatchError: {
        code: "nonce_mismatch",
        desc: "Nonce mismatch error. This may be caused by a race condition in concurrent requests."
    },
    nonceNotFoundError: {
        code: "nonce_not_found",
        desc: "nonce not found"
    },
    noTokensFoundError: {
        code: "no_tokens_found",
        desc: "No tokens were found for the given scopes, and no authorization code was passed to acquireToken. You must retrieve an authorization code before making a call to acquireToken()."
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
    multipleMatchingAppMetadata: {
        code: "multiple_matching_appMetadata",
        desc: "The cache contains multiple appMetadata satisfying the given parameters. Please pass more info to obtain the correct appMetadata"
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
    },
    userTimeoutReached: {
        code: "user_timeout_reached",
        desc: "User defined timeout for device code polling reached",
    },
    tokenClaimsRequired: {
        code: "token_claims_cnf_required_for_signedjwt",
        desc: "Cannot generate a POP jwt if the token_claims are not populated"
    },
    noAuthorizationCodeFromServer: {
        code: "authorization_code_missing_from_server_response",
        desc: "Server response does not contain an authorization code to proceed"
    },
    noAzureRegionDetected: {
        code: "no_azure_region_detected",
        desc: "No azure region was detected and no fallback was made available"
    },
    accessTokenEntityNullError: {
        code: "access_token_entity_null",
        desc: "Access token entity is null, please check logs and cache to ensure a valid access token is present."
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
    static createClientInfoEmptyError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.clientInfoEmptyError.code,
            `${ClientAuthErrorMessage.clientInfoEmptyError.desc}`);
    }

    /**
     * Creates an error thrown when the id token extraction errors out.
     * @param err
     */
    static createTokenParsingError(caughtExtractionError: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.tokenParsingError.code,
            `${ClientAuthErrorMessage.tokenParsingError.desc} Failed with error: ${caughtExtractionError}`);
    }

    /**
     * Creates an error thrown when the id token string is null or empty.
     * @param invalidRawTokenString
     */
    static createTokenNullOrEmptyError(invalidRawTokenString: string) : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.nullOrEmptyToken.code,
            `${ClientAuthErrorMessage.nullOrEmptyToken.desc} Raw Token Value: ${invalidRawTokenString}`);
    }

    /**
     * Creates an error thrown when the endpoint discovery doesn't complete correctly.
     */
    static createEndpointDiscoveryIncompleteError(errDetail: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.endpointResolutionError.code,
            `${ClientAuthErrorMessage.endpointResolutionError.desc} Detail: ${errDetail}`);
    }

    /**
     * Creates an error thrown when the fetch client throws
     */
    static createNetworkError(endpoint: string, errDetail: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.networkError.code,
            `${ClientAuthErrorMessage.networkError.desc} | Fetch client threw: ${errDetail} | Attempted to reach: ${endpoint.split("?")[0]}`);
    }

    /**
     * Creates an error thrown when the openid-configuration endpoint cannot be reached or does not contain the required data
     */
    static createUnableToGetOpenidConfigError(errDetail: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.unableToGetOpenidConfigError.code,
            `${ClientAuthErrorMessage.unableToGetOpenidConfigError.desc} Attempted to retrieve endpoints from: ${errDetail}`);
    }

    /**
     * Creates an error thrown when the hash cannot be deserialized.
     * @param hashParamObj
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
     * Creates an error thrown when the state is not present
     * @param missingState
     */
    static createStateNotFoundError(missingState: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.stateNotFoundError.code,
            `${ClientAuthErrorMessage.stateNotFoundError.desc}:  ${missingState}`);
    }

    /**
     * Creates an error thrown when the nonce does not match.
     */
    static createNonceMismatchError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.nonceMismatchError.code,
            ClientAuthErrorMessage.nonceMismatchError.desc);
    }

    /**
     * Creates an error thrown when the mnonce is not present
     * @param missingNonce
     */
    static createNonceNotFoundError(missingNonce: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.nonceNotFoundError.code,
            `${ClientAuthErrorMessage.nonceNotFoundError.desc}:  ${missingNonce}`);
    }

    /**
     * Creates an error thrown when the authorization code required for a token request is null or empty.
     */
    static createNoTokensFoundError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.noTokensFoundError.code, ClientAuthErrorMessage.noTokensFoundError.desc);
    }

    /**
     * Throws error when multiple tokens are in cache.
     */
    static createMultipleMatchingTokensInCacheError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.multipleMatchingTokens.code,
            `${ClientAuthErrorMessage.multipleMatchingTokens.desc}.`);
    }

    /**
     * Throws error when multiple accounts are in cache for the given params
     */
    static createMultipleMatchingAccountsInCacheError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.multipleMatchingAccounts.code,
            ClientAuthErrorMessage.multipleMatchingAccounts.desc);
    }

    /**
     * Throws error when multiple appMetada are in cache for the given clientId.
     */
    static createMultipleMatchingAppMetadataInCacheError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.multipleMatchingAppMetadata.code,
            ClientAuthErrorMessage.multipleMatchingAppMetadata.desc);
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

    /**
     * Throws error if the user defined timeout is reached.
     */
    static createUserTimeoutReachedError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.userTimeoutReached.code, ClientAuthErrorMessage.userTimeoutReached.desc);
    }

    /*
     * Throws error if token claims are not populated for a signed jwt generation
     */
    static createTokenClaimsRequiredError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.tokenClaimsRequired.code, ClientAuthErrorMessage.tokenClaimsRequired.desc);
    }

    /**
     * Throws error when the authorization code is missing from the server response
     */
    static createNoAuthCodeInServerResponseError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.noAuthorizationCodeFromServer.code, ClientAuthErrorMessage.noAuthorizationCodeFromServer.desc);
    }
}
