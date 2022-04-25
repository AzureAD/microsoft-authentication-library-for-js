/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ExpressNextFunction, ExpressRequest, ExpressResponse } from "../request/MiddlewareTypes";

/**
 * Response object for token validation middleware API
 * - req          - Express Request object
 * - res          - Express Response object
 * - next         - Express Next function
 */
export type TokenValidationMiddlewareResponse = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => void;
