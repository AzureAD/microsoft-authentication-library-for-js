/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export abstract class NativeAuthApiResponseBase {
    protected constructor(public correlationId?: string) {}
}
