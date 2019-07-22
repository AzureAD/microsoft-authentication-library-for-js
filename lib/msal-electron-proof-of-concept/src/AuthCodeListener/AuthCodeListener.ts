// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export abstract class AuthCodeListener {
    private hostName;

    constructor(hostName: string) {
        this.hostName = hostName;
    }

    public get host(): string {
        return this.hostName;
    }

    public abstract start(): void;
    public abstract close(): void;
}
