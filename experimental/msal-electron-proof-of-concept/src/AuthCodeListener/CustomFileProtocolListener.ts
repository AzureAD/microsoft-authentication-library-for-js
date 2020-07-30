// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthCodeListener } from './AuthCodeListener';

import { protocol } from 'electron';
import * as path from 'path';
import * as url from 'url';

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
    public start(): void {
        protocol.registerFileProtocol(this.host, (req, callback) => {
            const requestUrl = url.parse(req.url, true);
            callback(path.normalize(`${__dirname}/${requestUrl.path}`));
        });
    }

    /**
     * Unregisters a custom file protocol to stop listening for
     * Auth Code response.
     */
    public close() {
        protocol.unregisterProtocol(this.host);
    }
}
