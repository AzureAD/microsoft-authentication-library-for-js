/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";
import { NetworkResponse } from "./NetworkResponse.js";

/**
 * Certificate material used to establish a mutual-TLS (mTLS) connection for
 * Proof-of-Possession token requests. Both values are PEM-encoded strings.
 */
export type MtlsCertificate = {
    /** PEM-encoded client certificate (or certificate chain) presented on the TLS handshake. */
    cert: string;
    /** PEM-encoded private key for the client certificate. */
    key: string;
};

/**
 * Options allowed by network request APIs.
 */
export type NetworkRequestOptions = {
    headers?: Record<string, string>;
    body?: string;
    /**
     * Client certificate to present on the outbound mutual-TLS connection. When set, the network
     * module MUST establish the connection using this certificate (see {@link INetworkModule}).
     * Only honored by mTLS-capable transports (the built-in msal-node HttpClient).
     */
    mtlsCertificate?: MtlsCertificate;
};

/**
 * Client network interface to send backend requests.
 * @interface
 */
export interface INetworkModule {
    /**
     * Interface function for async network "GET" requests. Based on the Fetch standard: https://fetch.spec.whatwg.org/
     * @param url
     * @param options - Headers and/or body to include on the request
     * @param timeout
     */
    sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions,
        timeout?: number
    ): Promise<NetworkResponse<T>>;

    /**
     * Interface function for async network "POST" requests. Based on the Fetch standard: https://fetch.spec.whatwg.org/
     * @param url
     * @param options - Headers and/or body to include on the request
     */
    sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>>;
}

export const StubbedNetworkModule: INetworkModule = {
    // Module-level singleton: no per-request correlationId available
    sendGetRequestAsync: () => {
        return Promise.reject(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented, "")
        );
    },
    sendPostRequestAsync: () => {
        return Promise.reject(
            createClientAuthError(ClientAuthErrorCodes.methodNotImplemented, "")
        );
    },
};
