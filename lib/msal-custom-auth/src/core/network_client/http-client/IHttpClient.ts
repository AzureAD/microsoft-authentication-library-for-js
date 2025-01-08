/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HttpRequestMessage, HttpResponseMessage } from "./HttpMessage.js";

/**
 * Interface for HTTP client.
 */
export interface IHttpClient {
    /**
     * Sends a request.
     * @param request The request to send.
     */
    sendAsync(request: HttpRequestMessage): Promise<HttpResponseMessage>;
}
