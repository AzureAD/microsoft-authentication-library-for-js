/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthResponse } from "./AuthResponse";

/**
 * CodeResponse type returned by library containing authorization code.
 * - code: authorization code returned from interactive call
 * - userRequestState: User given state
 */
export type CodeResponse = AuthResponse & {
    code: string
};
