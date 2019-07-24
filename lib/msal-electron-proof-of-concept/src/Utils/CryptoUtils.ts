// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class CryptoUtils {
    static generateStateId(): string {
        return Math.random().toString(36).substr(7);
    }
}
