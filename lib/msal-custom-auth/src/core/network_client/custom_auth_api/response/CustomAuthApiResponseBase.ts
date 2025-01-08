/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export abstract class CustomAuthApiResponseBase {
    protected constructor(public correlation_id?: string) {}
}
