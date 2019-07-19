// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthenticationParameters } from '../AuthenticationParameters';
import { AuthOptions } from '../AuthOptions';
import { AadAuthority } from '../Authority/AadAuthority';
import { ClientConfigurationError } from '../Error/ClientConfigurationError';
import { AuthorizationCodeRequestParameters } from '../ServerRequest/AuthorizationCodeRequestParameters';
import { ClientApplication } from './ClientApplication';

import { strict as assert } from 'assert';
import { BrowserWindow, protocol } from 'electron';
import * as path from 'path';
import * as url from 'url';

/**
 * PublicClientApplication class
 *
 * This class can be instantiated into objects that the developer
 * can use in order to acquire tokens.
 */
export class PublicClientApplication extends ClientApplication {
    authWindow: BrowserWindow;
    constructor(authOptions: AuthOptions) {
        super(authOptions);
    }

    /**
     * The acquireToken method uses the Authorization Code
     * Grant to retrieve an access token from the AAD authorization server,
     * which can be used to make authenticated calls to an resource server
     * such as MS Graph.
     */
    public acquireToken(request: AuthenticationParameters): string {
        // Validate and filter scopes
        this.validateInputScopes(request.scopes);
        // Set Authority URL from developer input or default if not in request
        const authorityUrl = request.authority ? request.authority : this.authorityUrl;
        // Create Authority Instance
        const authorityInstance = new AadAuthority(authorityUrl);
        // Build Server Authentication Request
        const authCodeRequestParameters = new AuthorizationCodeRequestParameters(
            authorityInstance,
            this.clientId,
            this.redirectUri,
            request.scopes);
        protocol.registerFileProtocol('msal', (req, callback) => {
                const urlPath = req.url.replace(`msal://`, '');
                callback(path.normalize(`${__dirname}/${urlPath}`));
            }, (error) => {
                if (error) {
                    console.error(`Error: Failed to register custom protocol 'msal'.`);
                }
            });
        this.openAuthWindow();
        this.authWindow.loadURL(authCodeRequestParameters.buildRequestUrl());

        this.authWindow.webContents.on('will-redirect', (event, codeURL) => {
            const { query: queryParams } = url.parse(codeURL, true);
            console.log(queryParams);
        });
        return 'Access Token';
    }

    private validateInputScopes(scopes: string[]): void {
        // Check that scopes are present
        assert(scopes, ClientConfigurationError.createScopesRequiredError(scopes));

        // Check that scopes is an array
        if (!Array.isArray(scopes)) {
            throw ClientConfigurationError.createScopesNonArrayError(scopes);
        }

        // Check that scopes array is non-empty
        if (scopes.length < 1) {
            throw ClientConfigurationError.createEmptyScopesArrayError(scopes);
        }
    }

    private openAuthWindow() {
        this.authWindow = new BrowserWindow({
            height: 400,
            width: 800,
            alwaysOnTop: true,
            webPreferences: {
                contextIsolation: true
            }
        });
        this.authWindow.on('closed', () => {
            this.authWindow = null;
        });
    }

}
