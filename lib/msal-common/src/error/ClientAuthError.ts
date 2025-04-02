/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError.js";
import * as ClientAuthErrorCodes from "./ClientAuthErrorCodes.js";
export { ClientAuthErrorCodes }; // Allow importing as "ClientAuthErrorCodes";

/**
 * ClientAuthErrorMessage class containing string constants used by error codes and messages.
 */

export const ClientAuthErrorMessages = {
    [ClientAuthErrorCodes.clientInfoDecodingError]:
        "The client info could not be parsed/decoded correctly",
    [ClientAuthErrorCodes.clientInfoEmptyError]: "The client info was empty",
    [ClientAuthErrorCodes.tokenParsingError]: "Token cannot be parsed",
    [ClientAuthErrorCodes.nullOrEmptyToken]: "The token is null or empty",
    [ClientAuthErrorCodes.endpointResolutionError]:
        "Endpoints cannot be resolved",
    [ClientAuthErrorCodes.networkError]: "Network request failed",
    [ClientAuthErrorCodes.openIdConfigError]:
        "Could not retrieve endpoints. Check your authority and verify the .well-known/openid-configuration endpoint returns the required endpoints.",
    [ClientAuthErrorCodes.hashNotDeserialized]:
        "The hash parameters could not be deserialized",
    [ClientAuthErrorCodes.invalidState]: "State was not the expected format",
    [ClientAuthErrorCodes.stateMismatch]: "State mismatch error",
    [ClientAuthErrorCodes.stateNotFound]: "State not found",
    [ClientAuthErrorCodes.nonceMismatch]: "Nonce mismatch error",
    [ClientAuthErrorCodes.authTimeNotFound]:
        "Max Age was requested and the ID token is missing the auth_time variable." +
        " auth_time is an optional claim and is not enabled by default - it must be enabled." +
        " See https://aka.ms/msaljs/optional-claims for more information.",
    [ClientAuthErrorCodes.maxAgeTranspired]:
        "Max Age is set to 0, or too much time has elapsed since the last end-user authentication.",
    [ClientAuthErrorCodes.multipleMatchingTokens]:
        "The cache contains multiple tokens satisfying the requirements. " +
        "Call AcquireToken again providing more requirements such as authority or account.",
    [ClientAuthErrorCodes.multipleMatchingAccounts]:
        "The cache contains multiple accounts satisfying the given parameters. Please pass more info to obtain the correct account",
    [ClientAuthErrorCodes.multipleMatchingAppMetadata]:
        "The cache contains multiple appMetadata satisfying the given parameters. Please pass more info to obtain the correct appMetadata",
    [ClientAuthErrorCodes.requestCannotBeMade]:
        "Token request cannot be made without authorization code or refresh token.",
    [ClientAuthErrorCodes.cannotRemoveEmptyScope]:
        "Cannot remove null or empty scope from ScopeSet",
    [ClientAuthErrorCodes.cannotAppendScopeSet]: "Cannot append ScopeSet",
    [ClientAuthErrorCodes.emptyInputScopeSet]:
        "Empty input ScopeSet cannot be processed",
    [ClientAuthErrorCodes.deviceCodePollingCancelled]:
        "Caller has cancelled token endpoint polling during device code flow by setting DeviceCodeRequest.cancel = true.",
    [ClientAuthErrorCodes.deviceCodeExpired]: "Device code is expired.",
    [ClientAuthErrorCodes.deviceCodeUnknownError]:
        "Device code stopped polling for unknown reasons.",
    [ClientAuthErrorCodes.noAccountInSilentRequest]:
        "Please pass an account object, silent flow is not supported without account information",
    [ClientAuthErrorCodes.invalidCacheRecord]:
        "Cache record object was null or undefined.",
    [ClientAuthErrorCodes.invalidCacheEnvironment]:
        "Invalid environment when attempting to create cache entry",
    [ClientAuthErrorCodes.noAccountFound]:
        "No account found in cache for given key.",
    [ClientAuthErrorCodes.noCryptoObject]: "No crypto object detected.",
    [ClientAuthErrorCodes.unexpectedCredentialType]:
        "Unexpected credential type.",
    [ClientAuthErrorCodes.invalidAssertion]:
        "Client assertion must meet requirements described in https://tools.ietf.org/html/rfc7515",
    [ClientAuthErrorCodes.invalidClientCredential]:
        "Client credential (secret, certificate, or assertion) must not be empty when creating a confidential client. An application should at most have one credential",
    [ClientAuthErrorCodes.tokenRefreshRequired]:
        "Cannot return token from cache because it must be refreshed. This may be due to one of the following reasons: forceRefresh parameter is set to true, claims have been requested, there is no cached access token or it is expired.",
    [ClientAuthErrorCodes.userTimeoutReached]:
        "User defined timeout for device code polling reached",
    [ClientAuthErrorCodes.tokenClaimsCnfRequiredForSignedJwt]:
        "Cannot generate a POP jwt if the token_claims are not populated",
    [ClientAuthErrorCodes.authorizationCodeMissingFromServerResponse]:
        "Server response does not contain an authorization code to proceed",
    [ClientAuthErrorCodes.bindingKeyNotRemoved]:
        "Could not remove the credential's binding key from storage.",
    [ClientAuthErrorCodes.endSessionEndpointNotSupported]:
        "The provided authority does not support logout",
    [ClientAuthErrorCodes.keyIdMissing]:
        "A keyId value is missing from the requested bound token's cache record and is required to match the token to it's stored binding key.",
    [ClientAuthErrorCodes.noNetworkConnectivity]:
        "No network connectivity. Check your internet connection.",
    [ClientAuthErrorCodes.userCanceled]: "User cancelled the flow.",
    [ClientAuthErrorCodes.missingTenantIdError]:
        "A tenant id - not common, organizations, or consumers - must be specified when using the client_credentials flow.",
    [ClientAuthErrorCodes.methodNotImplemented]:
        "This method has not been implemented",
    [ClientAuthErrorCodes.nestedAppAuthBridgeDisabled]:
        "The nested app auth bridge is disabled",
};

/**
 * Error thrown when there is an error in the client code running on the browser.
 */
export class ClientAuthError extends AuthError {
    constructor(errorCode: string, additionalMessage?: string) {
        super(
            errorCode,
            additionalMessage
                ? `${ClientAuthErrorMessages[errorCode]}: ${additionalMessage}`
                : ClientAuthErrorMessages[errorCode]
        );
        this.name = "ClientAuthError";

        Object.setPrototypeOf(this, ClientAuthError.prototype);
    }
}

export function createClientAuthError(
    errorCode: string,
    additionalMessage?: string
): ClientAuthError {
    return new ClientAuthError(errorCode, additionalMessage);
}
