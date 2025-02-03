/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApiErrorResponse } from "./types/ApiErrorResponseTypes.js";

export class ApiError extends Error {
    constructor(
        public response: Response,
        public errorResponse: ApiErrorResponse,
        message?: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export class NotFoundError extends ApiError {
    constructor(response: Response, errorResponse: ApiErrorResponse) {
        super(response, errorResponse, "Resource not found");
        this.name = "NotFoundError";
    }
}

export class UnauthorizedError extends ApiError {
    constructor(response: Response, errorResponse: ApiErrorResponse) {
        super(response, errorResponse, "Unauthorized access");
        this.name = "UnauthorizedError";
    }
}
