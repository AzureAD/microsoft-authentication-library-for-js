/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common/node";

/**
 * NodeAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const NodeAuthErrorMessage = {
    invalidLoopbackAddressType: {
        code: "invalid_loopback_server_address_type",
        desc: "Loopback server address is not type string. This is unexpected.",
    },
    unableToLoadRedirectUri: {
        code: "unable_to_load_redirectUrl",
        desc: "Loopback server callback was invoked without a url. This is unexpected.",
    },
    noAuthCodeInResponse: {
        code: "no_auth_code_in_response",
        desc: "No auth code found in the server response. Please check your network trace to determine what happened.",
    },
    noLoopbackServerExists: {
        code: "no_loopback_server_exists",
        desc: "No loopback server exists yet.",
    },
    loopbackServerAlreadyExists: {
        code: "loopback_server_already_exists",
        desc: "Loopback server already exists. Cannot create another.",
    },
    loopbackServerTimeout: {
        code: "loopback_server_timeout",
        desc: "Timed out waiting for auth code listener to be registered.",
    },
    stateNotFoundError: {
        code: "state_not_found",
        desc: "State not found. Please verify that the request originated from msal.",
    },
    thumbprintMissing: {
        code: "thumbprint_missing_from_client_certificate",
        desc: "Client certificate does not contain a SHA-1 or SHA-256 thumbprint.",
    },
    redirectUriNotSupported: {
        code: "redirect_uri_not_supported",
        desc: "RedirectUri is not supported in this scenario. Please remove redirectUri from the request.",
    },
    mtlsBindingCertificateMissing: {
        code: "mtls_binding_certificate_missing",
        desc: "mTLS Proof-of-Possession was requested but no usable binding certificate is available. Configure a clientCertificate with both an x5c (public certificate or chain) and a privateKey on the application, or supply a tokenBindingCertificate on the request; a thumbprint-only certificate is not sufficient for mtls_pop.",
    },
    mtlsBindingCertificateMissingPrivateKey: {
        code: "mtls_binding_certificate_missing_private_key",
        desc: "The certificate used for mTLS Proof-of-Possession is missing its private key. Both x5c (public certificate) and privateKey are required.",
    },
    mtlsBindingCertificateMissingCertificate: {
        code: "mtls_binding_certificate_missing_certificate",
        desc: "The certificate used for mTLS Proof-of-Possession is missing its public certificate (x5c). Both x5c (public certificate) and privateKey are required.",
    },
    mtlsCustomNetworkClientUnsupported: {
        code: "mtls_custom_network_client_unsupported",
        desc: "mTLS Proof-of-Possession requires MSAL's built-in HttpClient to attach the client certificate to the TLS connection. A custom networkClient cannot be used with mtlsProofOfPossession.",
    },
    tokenBindingCertificateWithoutAssertion: {
        code: "token_binding_certificate_without_assertion",
        desc: "A request-level tokenBindingCertificate was supplied for mTLS Proof-of-Possession (FIC Leg 2), but no client assertion was resolved from the request or the application configuration. FIC Leg 2 presents a client assertion over a certificate-bound connection, so a clientAssertion is required alongside tokenBindingCertificate.",
    },
    tokenBindingCertificateWithoutMtlsPop: {
        code: "token_binding_certificate_without_mtls_pop",
        desc: "A request-level tokenBindingCertificate was supplied, but mTLS Proof-of-Possession is not enabled on the request. Set mtlsProofOfPossession: true so the token is bound to the certificate; otherwise the certificate is ignored and the resulting token would not be certificate-bound.",
    },
};

export class NodeAuthError extends AuthError {
    constructor(
        errorCode: string,
        correlationId: string,
        errorMessage?: string
    ) {
        super(errorCode, correlationId, errorMessage);
        this.name = "NodeAuthError";
    }

    /**
     * Creates an error thrown if loopback server address is of type string.
     */
    static createInvalidLoopbackAddressTypeError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.invalidLoopbackAddressType.code,
            "",
            `${NodeAuthErrorMessage.invalidLoopbackAddressType.desc}`
        );
    }

    /**
     * Creates an error thrown if the loopback server is unable to get a url.
     */
    static createUnableToLoadRedirectUrlError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.unableToLoadRedirectUri.code,
            "",
            `${NodeAuthErrorMessage.unableToLoadRedirectUri.desc}`
        );
    }

    /**
     * Creates an error thrown if the server response does not contain an auth code.
     */
    static createNoAuthCodeInResponseError(
        correlationId: string = ""
    ): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.noAuthCodeInResponse.code,
            correlationId,
            `${NodeAuthErrorMessage.noAuthCodeInResponse.desc}`
        );
    }

    /**
     * Creates an error thrown if the loopback server has not been spun up yet.
     */
    static createNoLoopbackServerExistsError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.noLoopbackServerExists.code,
            "",
            `${NodeAuthErrorMessage.noLoopbackServerExists.desc}`
        );
    }

    /**
     * Creates an error thrown if a loopback server already exists when attempting to create another one.
     */
    static createLoopbackServerAlreadyExistsError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.loopbackServerAlreadyExists.code,
            "",
            `${NodeAuthErrorMessage.loopbackServerAlreadyExists.desc}`
        );
    }

    /**
     * Creates an error thrown if the loopback server times out registering the auth code listener.
     */
    static createLoopbackServerTimeoutError(
        correlationId: string = ""
    ): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.loopbackServerTimeout.code,
            correlationId,
            `${NodeAuthErrorMessage.loopbackServerTimeout.desc}`
        );
    }

    /**
     * Creates an error thrown when the state is not present.
     */
    static createStateNotFoundError(correlationId: string = ""): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.stateNotFoundError.code,
            correlationId,
            NodeAuthErrorMessage.stateNotFoundError.desc
        );
    }

    /**
     * Creates an error thrown when client certificate was provided, but neither the SHA-1 or SHA-256 thumbprints were provided
     */
    static createThumbprintMissingError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.thumbprintMissing.code,
            "",
            NodeAuthErrorMessage.thumbprintMissing.desc
        );
    }

    /**
     * Creates an error thrown when redirectUri is provided in an unsupported scenario
     */
    static createRedirectUriNotSupportedError(
        correlationId: string = ""
    ): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.redirectUriNotSupported.code,
            correlationId,
            NodeAuthErrorMessage.redirectUriNotSupported.desc
        );
    }

    /**
     * Creates an error thrown when mTLS Proof-of-Possession is requested but no binding certificate
     * (app clientCertificate or request tokenBindingCertificate) is available.
     */
    static createMtlsBindingCertificateMissingError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.mtlsBindingCertificateMissing.code,
            "",
            NodeAuthErrorMessage.mtlsBindingCertificateMissing.desc
        );
    }

    /**
     * Creates an error thrown when the mTLS binding certificate is missing its private key.
     */
    static createMtlsBindingCertificateMissingPrivateKeyError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.mtlsBindingCertificateMissingPrivateKey.code,
            "",
            NodeAuthErrorMessage.mtlsBindingCertificateMissingPrivateKey.desc
        );
    }

    /**
     * Creates an error thrown when the mTLS binding certificate is missing its public certificate (x5c).
     */
    static createMtlsBindingCertificateMissingCertificateError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.mtlsBindingCertificateMissingCertificate.code,
            "",
            NodeAuthErrorMessage.mtlsBindingCertificateMissingCertificate.desc
        );
    }

    /**
     * Creates an error thrown when mTLS Proof-of-Possession is requested with a custom networkClient
     * that cannot attach the client certificate to the outbound TLS connection.
     */
    static createMtlsCustomNetworkClientUnsupportedError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.mtlsCustomNetworkClientUnsupported.code,
            "",
            NodeAuthErrorMessage.mtlsCustomNetworkClientUnsupported.desc
        );
    }

    /**
     * Creates an error thrown when a request-level tokenBindingCertificate is supplied for mTLS PoP
     * (FIC Leg 2) but no client assertion is resolved to present over the certificate-bound connection.
     */
    static createTokenBindingCertificateWithoutAssertionError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.tokenBindingCertificateWithoutAssertion.code,
            "",
            NodeAuthErrorMessage.tokenBindingCertificateWithoutAssertion.desc
        );
    }

    /**
     * Creates an error thrown when a request-level tokenBindingCertificate is supplied but mTLS
     * Proof-of-Possession is not enabled. Without mtlsProofOfPossession the certificate is never
     * consumed, so the request would silently return a token that is not certificate-bound.
     */
    static createTokenBindingCertificateWithoutMtlsPopError(
        correlationId: string = ""
    ): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.tokenBindingCertificateWithoutMtlsPop.code,
            correlationId,
            NodeAuthErrorMessage.tokenBindingCertificateWithoutMtlsPop.desc
        );
    }
}
