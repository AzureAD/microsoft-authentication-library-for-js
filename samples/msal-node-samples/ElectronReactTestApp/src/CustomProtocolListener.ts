// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthCodeListener } from './AuthCodeListener';

import { protocol } from 'electron';

/**
 * CustomProtocolListener can be instantiated in order
 * to register and unregister a custom typed protocol on which
 * MSAL can listen for Auth Code reponses.
 *
 * For information on available protocol types, check the Electron
 * protcol docs: https://www.electronjs.org/docs/latest/api/protocol/
 */

export class CustomProtocolListener extends AuthCodeListener {
    constructor(hostName: string) {
        super(hostName);
    }

    /**
     * Registers a custom string protocol on which the library will
     * listen for Auth Code response.
     */
    public start(): Promise<string> {
        const codePromise = new Promise<string>((resolve, reject) => {
            protocol.registerStringProtocol(this.host, (req, callback) => {
                const requestUrl = new URL(req.url);
                const authCode = requestUrl.searchParams.get('code');

                if (authCode) {
                    resolve(authCode)
                } else {
                    protocol.unregisterProtocol(this.host);
                    reject(new Error("No code found in URL"));
                }
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
