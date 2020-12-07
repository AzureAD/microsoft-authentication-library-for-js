// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * AuthCodeListener is the base class from which
 * special CustomFileProtocol and HttpAuthCode inherit
 * their structure and members.
 */
export abstract class AuthCodeListener {
    private hostName: string;

    /**
     * Constructor
     * @param hostName - A string that represents the host name that should be listened on (i.e. 'msal' or '127.0.0.1')
     */
    constructor(hostName: string) {
        this.hostName = hostName;
    }

    public get host(): string {
        return this.hostName;
    }

    public abstract start(): void;
    public abstract close(): void;
}