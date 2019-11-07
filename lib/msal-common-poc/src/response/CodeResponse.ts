/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthResponse } from "./AuthResponse";

export type CodeResponse = AuthResponse &
{
    code: string
}