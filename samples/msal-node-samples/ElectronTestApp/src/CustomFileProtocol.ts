// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthCodeListener } from './AuthCodeListener';

import { protocol } from 'electron';
import * as path from 'path';

/**
 * CustomFileProtocolListener can be instantiated in order
 * to register and unregister a custom file protocol on which
 * MSAL can listen for Auth Code reponses.
 */
export class CustomFileProtocolListener extends AuthCodeListener {
    constructor(hostName: string) {
        super(hostName);
    }

    /**
     * Registers a custom file protocol on which the library will
     * listen for Auth Code response.
     */
    public start(): Promise<string> {
        const codePromise = new Promise<string>((resolve, reject) => {
            protocol.registerFileProtocol(this.host, (req, callback) => {
                const requestUrl = new URL(req.url);
                const authCode = requestUrl.searchParams.get('code');
                if (authCode) {
                    resolve(authCode);
                }
                else {
                    reject(new Error("no code in URL"));
                }
                callback(path.normalize(`${__dirname}/${requestUrl.pathname}`));
            });
        });

        return codePromise;
    }

    /**
     * Unregisters a custom file protocol to stop listening for
     * Auth Code response.
     */
    public close() {
        protocol.unregisterProtocol(this.host);
    }
}
