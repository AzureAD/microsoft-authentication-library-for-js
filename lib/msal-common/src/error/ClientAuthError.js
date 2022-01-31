"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAuthError = exports.ClientAuthErrorMessage = void 0;
var tslib_1 = require("tslib");
var AuthError_1 = require("./AuthError");
/**
 * ClientAuthErrorMessage class containing string constants used by error codes and messages.
 */
exports.ClientAuthErrorMessage = {
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
    DeviceCodeUnknownError: {
        code: "device_code_unknown_error",
        desc: "Device code stopped polling for unknown reasons."
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
    },
    bindingKeyNotRemovedError: {
        code: "binding_key_not_removed",
        desc: "Could not remove the credential's binding key from storage."
    },
    logoutNotSupported: {
        code: "end_session_endpoint_not_supported",
        desc: "Provided authority does not support logout."
    }
};
/**
 * Error thrown when there is an error in the client code running on the browser.
 */
var ClientAuthError = /** @class */ (function (_super) {
    (0, tslib_1.__extends)(ClientAuthError, _super);
    function ClientAuthError(errorCode, errorMessage) {
        var _this = _super.call(this, errorCode, errorMessage) || this;
        _this.name = "ClientAuthError";
        Object.setPrototypeOf(_this, ClientAuthError.prototype);
        return _this;
    }
    /**
     * Creates an error thrown when client info object doesn't decode correctly.
     * @param caughtError
     */
    ClientAuthError.createClientInfoDecodingError = function (caughtError) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.clientInfoDecodingError.code, "".concat(exports.ClientAuthErrorMessage.clientInfoDecodingError.desc, " Failed with error: ").concat(caughtError));
    };
    /**
     * Creates an error thrown if the client info is empty.
     * @param rawClientInfo
     */
    ClientAuthError.createClientInfoEmptyError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.clientInfoEmptyError.code, "".concat(exports.ClientAuthErrorMessage.clientInfoEmptyError.desc));
    };
    /**
     * Creates an error thrown when the id token extraction errors out.
     * @param err
     */
    ClientAuthError.createTokenParsingError = function (caughtExtractionError) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.tokenParsingError.code, "".concat(exports.ClientAuthErrorMessage.tokenParsingError.desc, " Failed with error: ").concat(caughtExtractionError));
    };
    /**
     * Creates an error thrown when the id token string is null or empty.
     * @param invalidRawTokenString
     */
    ClientAuthError.createTokenNullOrEmptyError = function (invalidRawTokenString) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.nullOrEmptyToken.code, "".concat(exports.ClientAuthErrorMessage.nullOrEmptyToken.desc, " Raw Token Value: ").concat(invalidRawTokenString));
    };
    /**
     * Creates an error thrown when the endpoint discovery doesn't complete correctly.
     */
    ClientAuthError.createEndpointDiscoveryIncompleteError = function (errDetail) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.endpointResolutionError.code, "".concat(exports.ClientAuthErrorMessage.endpointResolutionError.desc, " Detail: ").concat(errDetail));
    };
    /**
     * Creates an error thrown when the fetch client throws
     */
    ClientAuthError.createNetworkError = function (endpoint, errDetail) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.networkError.code, "".concat(exports.ClientAuthErrorMessage.networkError.desc, " | Fetch client threw: ").concat(errDetail, " | Attempted to reach: ").concat(endpoint.split("?")[0]));
    };
    /**
     * Creates an error thrown when the openid-configuration endpoint cannot be reached or does not contain the required data
     */
    ClientAuthError.createUnableToGetOpenidConfigError = function (errDetail) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.unableToGetOpenidConfigError.code, "".concat(exports.ClientAuthErrorMessage.unableToGetOpenidConfigError.desc, " Attempted to retrieve endpoints from: ").concat(errDetail));
    };
    /**
     * Creates an error thrown when the hash cannot be deserialized.
     * @param hashParamObj
     */
    ClientAuthError.createHashNotDeserializedError = function (hashParamObj) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.hashNotDeserialized.code, "".concat(exports.ClientAuthErrorMessage.hashNotDeserialized.desc, " Given Object: ").concat(hashParamObj));
    };
    /**
     * Creates an error thrown when the state cannot be parsed.
     * @param invalidState
     */
    ClientAuthError.createInvalidStateError = function (invalidState, errorString) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.invalidStateError.code, "".concat(exports.ClientAuthErrorMessage.invalidStateError.desc, " Invalid State: ").concat(invalidState, ", Root Err: ").concat(errorString));
    };
    /**
     * Creates an error thrown when two states do not match.
     */
    ClientAuthError.createStateMismatchError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.stateMismatchError.code, exports.ClientAuthErrorMessage.stateMismatchError.desc);
    };
    /**
     * Creates an error thrown when the state is not present
     * @param missingState
     */
    ClientAuthError.createStateNotFoundError = function (missingState) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.stateNotFoundError.code, "".concat(exports.ClientAuthErrorMessage.stateNotFoundError.desc, ":  ").concat(missingState));
    };
    /**
     * Creates an error thrown when the nonce does not match.
     */
    ClientAuthError.createNonceMismatchError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.nonceMismatchError.code, exports.ClientAuthErrorMessage.nonceMismatchError.desc);
    };
    /**
     * Creates an error thrown when the mnonce is not present
     * @param missingNonce
     */
    ClientAuthError.createNonceNotFoundError = function (missingNonce) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.nonceNotFoundError.code, "".concat(exports.ClientAuthErrorMessage.nonceNotFoundError.desc, ":  ").concat(missingNonce));
    };
    /**
     * Throws error when multiple tokens are in cache.
     */
    ClientAuthError.createMultipleMatchingTokensInCacheError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.multipleMatchingTokens.code, "".concat(exports.ClientAuthErrorMessage.multipleMatchingTokens.desc, "."));
    };
    /**
     * Throws error when multiple accounts are in cache for the given params
     */
    ClientAuthError.createMultipleMatchingAccountsInCacheError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.multipleMatchingAccounts.code, exports.ClientAuthErrorMessage.multipleMatchingAccounts.desc);
    };
    /**
     * Throws error when multiple appMetada are in cache for the given clientId.
     */
    ClientAuthError.createMultipleMatchingAppMetadataInCacheError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.multipleMatchingAppMetadata.code, exports.ClientAuthErrorMessage.multipleMatchingAppMetadata.desc);
    };
    /**
     * Throws error when no auth code or refresh token is given to ServerTokenRequestParameters.
     */
    ClientAuthError.createTokenRequestCannotBeMadeError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.tokenRequestCannotBeMade.code, exports.ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
    };
    /**
     * Throws error when attempting to append a null, undefined or empty scope to a set
     * @param givenScope
     */
    ClientAuthError.createAppendEmptyScopeToSetError = function (givenScope) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.appendEmptyScopeError.code, "".concat(exports.ClientAuthErrorMessage.appendEmptyScopeError.desc, " Given Scope: ").concat(givenScope));
    };
    /**
     * Throws error when attempting to append a null, undefined or empty scope to a set
     * @param givenScope
     */
    ClientAuthError.createRemoveEmptyScopeFromSetError = function (givenScope) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.removeEmptyScopeError.code, "".concat(exports.ClientAuthErrorMessage.removeEmptyScopeError.desc, " Given Scope: ").concat(givenScope));
    };
    /**
     * Throws error when attempting to append null or empty ScopeSet.
     * @param appendError
     */
    ClientAuthError.createAppendScopeSetError = function (appendError) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.appendScopeSetError.code, "".concat(exports.ClientAuthErrorMessage.appendScopeSetError.desc, " Detail Error: ").concat(appendError));
    };
    /**
     * Throws error if ScopeSet is null or undefined.
     * @param givenScopeSet
     */
    ClientAuthError.createEmptyInputScopeSetError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.emptyInputScopeSetError.code, "".concat(exports.ClientAuthErrorMessage.emptyInputScopeSetError.desc));
    };
    /**
     * Throws error if user sets CancellationToken.cancel = true during polling of token endpoint during device code flow
     */
    ClientAuthError.createDeviceCodeCancelledError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.DeviceCodePollingCancelled.code, "".concat(exports.ClientAuthErrorMessage.DeviceCodePollingCancelled.desc));
    };
    /**
     * Throws error if device code is expired
     */
    ClientAuthError.createDeviceCodeExpiredError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.DeviceCodeExpired.code, "".concat(exports.ClientAuthErrorMessage.DeviceCodeExpired.desc));
    };
    /**
     * Throws error if device code is expired
     */
    ClientAuthError.createDeviceCodeUnknownError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.DeviceCodeUnknownError.code, "".concat(exports.ClientAuthErrorMessage.DeviceCodeUnknownError.desc));
    };
    /**
     * Throws error when silent requests are made without an account object
     */
    ClientAuthError.createNoAccountInSilentRequestError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.NoAccountInSilentRequest.code, "".concat(exports.ClientAuthErrorMessage.NoAccountInSilentRequest.desc));
    };
    /**
     * Throws error when cache record is null or undefined.
     */
    ClientAuthError.createNullOrUndefinedCacheRecord = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.invalidCacheRecord.code, exports.ClientAuthErrorMessage.invalidCacheRecord.desc);
    };
    /**
     * Throws error when provided environment is not part of the CloudDiscoveryMetadata object
     */
    ClientAuthError.createInvalidCacheEnvironmentError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.invalidCacheEnvironment.code, exports.ClientAuthErrorMessage.invalidCacheEnvironment.desc);
    };
    /**
     * Throws error when account is not found in cache.
     */
    ClientAuthError.createNoAccountFoundError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.noAccountFound.code, exports.ClientAuthErrorMessage.noAccountFound.desc);
    };
    /**
     * Throws error if ICachePlugin not set on CacheManager.
     */
    ClientAuthError.createCachePluginError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.CachePluginError.code, "".concat(exports.ClientAuthErrorMessage.CachePluginError.desc));
    };
    /**
     * Throws error if crypto object not found.
     * @param operationName
     */
    ClientAuthError.createNoCryptoObjectError = function (operationName) {
        return new ClientAuthError(exports.ClientAuthErrorMessage.noCryptoObj.code, "".concat(exports.ClientAuthErrorMessage.noCryptoObj.desc).concat(operationName));
    };
    /**
     * Throws error if cache type is invalid.
     */
    ClientAuthError.createInvalidCacheTypeError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.invalidCacheType.code, "".concat(exports.ClientAuthErrorMessage.invalidCacheType.desc));
    };
    /**
     * Throws error if unexpected account type.
     */
    ClientAuthError.createUnexpectedAccountTypeError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.unexpectedAccountType.code, "".concat(exports.ClientAuthErrorMessage.unexpectedAccountType.desc));
    };
    /**
     * Throws error if unexpected credential type.
     */
    ClientAuthError.createUnexpectedCredentialTypeError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.unexpectedCredentialType.code, "".concat(exports.ClientAuthErrorMessage.unexpectedCredentialType.desc));
    };
    /**
     * Throws error if client assertion is not valid.
     */
    ClientAuthError.createInvalidAssertionError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.invalidAssertion.code, "".concat(exports.ClientAuthErrorMessage.invalidAssertion.desc));
    };
    /**
     * Throws error if client assertion is not valid.
     */
    ClientAuthError.createInvalidCredentialError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.invalidClientCredential.code, "".concat(exports.ClientAuthErrorMessage.invalidClientCredential.desc));
    };
    /**
     * Throws error if token cannot be retrieved from cache due to refresh being required.
     */
    ClientAuthError.createRefreshRequiredError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.tokenRefreshRequired.code, exports.ClientAuthErrorMessage.tokenRefreshRequired.desc);
    };
    /**
     * Throws error if the user defined timeout is reached.
     */
    ClientAuthError.createUserTimeoutReachedError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.userTimeoutReached.code, exports.ClientAuthErrorMessage.userTimeoutReached.desc);
    };
    /*
     * Throws error if token claims are not populated for a signed jwt generation
     */
    ClientAuthError.createTokenClaimsRequiredError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.tokenClaimsRequired.code, exports.ClientAuthErrorMessage.tokenClaimsRequired.desc);
    };
    /**
     * Throws error when the authorization code is missing from the server response
     */
    ClientAuthError.createNoAuthCodeInServerResponseError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.noAuthorizationCodeFromServer.code, exports.ClientAuthErrorMessage.noAuthorizationCodeFromServer.desc);
    };
    ClientAuthError.createBindingKeyNotRemovedError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.bindingKeyNotRemovedError.code, exports.ClientAuthErrorMessage.bindingKeyNotRemovedError.desc);
    };
    /**
     * Thrown when logout is attempted for an authority that doesnt have an end_session_endpoint
     */
    ClientAuthError.createLogoutNotSupportedError = function () {
        return new ClientAuthError(exports.ClientAuthErrorMessage.logoutNotSupported.code, exports.ClientAuthErrorMessage.logoutNotSupported.desc);
    };
    return ClientAuthError;
}(AuthError_1.AuthError));
exports.ClientAuthError = ClientAuthError;
//# sourceMappingURL=ClientAuthError.js.map