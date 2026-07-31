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
        desc: "mTLS Proof-of-Possession was requested but no usable binding certificate is available. Configure a clientCertificate with both an x5c (public certificate or chain) and a privateKey on the application; a thumbprint-only certificate is not sufficient for mtls_pop.",
    },
    mtlsBindingCertificateMissingPrivateKey: {
        code: "mtls_binding_certificate_missing_private_key",
        desc: "The certificate used for mTLS Proof-of-Possession is missing its private key. Both x5c (public certificate) and privateKey are required.",
    },
    mtlsCustomNetworkClientUnsupported: {
        code: "mtls_custom_network_client_unsupported",
        desc: "mTLS Proof-of-Possession requires MSAL's built-in HttpClient to attach the client certificate to the TLS connection. A custom networkClient cannot be used with mtlsProofOfPossession.",
    },
    sendCertificateOverMtlsMissingCertificate: {
        code: "send_certificate_over_mtls_missing_certificate",
        desc: "sendCertificateOverMtls was enabled but no usable client certificate is configured. Provide a clientCertificate with both an x5c (public certificate or chain) and a privateKey; sendCertificateOverMtls presents that certificate on the TLS handshake to the mTLS token endpoint.",
    },
    sendCertificateOverMtlsWithClientAssertion: {
        code: "send_certificate_over_mtls_with_client_assertion",
        desc: "sendCertificateOverMtls requires the configured clientCertificate to produce the client_assertion so it carries the forced x5c chain that authenticates the certificate over the mTLS channel. A developer-supplied clientAssertion (static string or callback) cannot be given an x5c header and is not supported with sendCertificateOverMtls. Remove clientAssertion, or disable sendCertificateOverMtls.",
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
     * (app clientCertificate) is available.
     */
    static createMtlsBindingCertificateMissingError(
        correlationId: string = ""
    ): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.mtlsBindingCertificateMissing.code,
            correlationId,
            NodeAuthErrorMessage.mtlsBindingCertificateMissing.desc
        );
    }

    /**
     * Creates an error thrown when the mTLS binding certificate is missing its private key.
     */
    static createMtlsBindingCertificateMissingPrivateKeyError(
        correlationId: string = ""
    ): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.mtlsBindingCertificateMissingPrivateKey.code,
            correlationId,
            NodeAuthErrorMessage.mtlsBindingCertificateMissingPrivateKey.desc
        );
    }

    /**
     * Creates an error thrown when mTLS Proof-of-Possession is requested with a custom networkClient
     * that cannot attach the client certificate to the outbound TLS connection.
     */
    static createMtlsCustomNetworkClientUnsupportedError(
        correlationId: string = ""
    ): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.mtlsCustomNetworkClientUnsupported.code,
            correlationId,
            NodeAuthErrorMessage.mtlsCustomNetworkClientUnsupported.desc
        );
    }

    /**
     * Creates an error thrown when sendCertificateOverMtls is enabled but no usable client
     * certificate (x5c + privateKey) is configured.
     */
    static createSendCertificateOverMtlsMissingCertificateError(
        correlationId: string = ""
    ): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.sendCertificateOverMtlsMissingCertificate.code,
            correlationId,
            NodeAuthErrorMessage.sendCertificateOverMtlsMissingCertificate.desc
        );
    }

    /**
     * Creates an error thrown when sendCertificateOverMtls is enabled together with a
     * developer-supplied clientAssertion. The opaque assertion would populate the request body
     * without the forced x5c chain the mTLS SN/I match requires, so the combination is rejected
     * (fail-closed, mirroring MSAL.NET's InvalidCredentialMaterial) rather than silently emitting
     * an x5c-less assertion on the mTLS handshake.
     */
    static createSendCertificateOverMtlsWithClientAssertionError(
        correlationId: string = ""
    ): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.sendCertificateOverMtlsWithClientAssertion.code,
            correlationId,
            NodeAuthErrorMessage.sendCertificateOverMtlsWithClientAssertion.desc
        );
    }
}
