/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Represents an HTTP request message.
 */
export class HttpRequestMessage {
    constructor(
        public method: HttpMethodType,
        public url: string,
        public headers: Record<string, string>,
        public correlationId: string,
        public body?: string
    ) {}
}

/**
 * Represents an HTTP response message.
 */
export class HttpResponseMessage {
    constructor(
        public status: number,
        public body: string,
        public headers: Record<string, string>
    ) {}

    isSuccessful(): boolean {
        return this.status >= 200 && this.status < 300;
    }

    getHeader(headerName: string): string {
        return this.headers[headerName] ?? "";
    }
}

/**
 * Represents an HTTP method type.
 */
export const HttpMethod = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
} as const;

/**
 * Type inference for the HTTP method types
 */
export type HttpMethodType = (typeof HttpMethod)[keyof typeof HttpMethod];

/**
 * Represents an HTTP status code type.
 */
export const HttpStatusCode = {
    // Informational responses
    CONTINUE: 100,
    SWITCHING_PROTOCOLS: 101,
    PROCESSING: 102,

    // Success responses
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NON_AUTHORITATIVE_INFORMATION: 203,
    NO_CONTENT: 204,
    RESET_CONTENT: 205,
    PARTIAL_CONTENT: 206,

    // Redirection messages
    MULTIPLE_CHOICES: 300,
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    SEE_OTHER: 303,
    NOT_MODIFIED: 304,
    USE_PROXY: 305,
    TEMPORARY_REDIRECT: 307,
    PERMANENT_REDIRECT: 308,

    // Client error responses
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    NOT_ACCEPTABLE: 406,
    PROXY_AUTHENTICATION_REQUIRED: 407,
    REQUEST_TIMEOUT: 408,
    CONFLICT: 409,
    GONE: 410,
    LENGTH_REQUIRED: 411,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE: 413,
    URI_TOO_LONG: 414,
    UNSUPPORTED_MEDIA_TYPE: 415,
    TOO_MANY_REQUESTS: 429,
    RETRY_WITH: 449,

    // Server error responses
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
    HTTP_VERSION_NOT_SUPPORTED: 505,
} as const;
