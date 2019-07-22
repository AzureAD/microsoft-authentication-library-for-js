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
import { Authority } from '../Authority/Authority';
import { DEFAULT_POPUP_WIDTH, DEFAULT_POPUP_HEIGHT } from '../DefaultConstants';
import { AuthorizationCodeRequestError } from '../Error/AuthorizationCodeRequestError';

/**
 * PublicClientApplication class
 *
 * This class can be instantiated into objects that the developer
 * can use in order to acquire tokens.
 */
export class PublicClientApplication extends ClientApplication {
    private authWindow: BrowserWindow;

    constructor(authOptions: AuthOptions) {
        super(authOptions);
    }

    /**
     * The acquireToken async method uses the Authorization Code
     * Grant to retrieve an access token from the AAD authorization server,
     * which can be used to make authenticated calls to an resource server
     * such as MS Graph.
     */
    public async acquireToken(request: AuthenticationParameters): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            try {
                // Validate and filter scopes
                this.validateInputScopes(request.scopes);
                // Set Authority URL from developer input or default if not in request
                const authorityUrl = request.authority ? request.authority : this.authorityUrl;
                // Create Authority Instance
                const authorityInstance = new AadAuthority(authorityUrl);
                // Get Authorization Code
                const authCode = this.retrieveAuthCode(authorityInstance, request.scopes);
                resolve(authCode);
            } catch (error) {
                return reject(error);
            }
        });
    }

    /**
     * Executes a series of checks and validations on the scopes array
     * that was sent in the PublicClientApplication's constructor.
     * @param scopes
     */
    private validateInputScopes(scopes: string[]): void {
        // Throws if scopes object is not truthy
        assert(scopes, ClientConfigurationError.createScopesRequiredError(scopes));

        // Throws if scopes object is not an array.
        if (!Array.isArray(scopes)) {
            throw ClientConfigurationError.createScopesNonArrayError(scopes);
        }

        // Throws if scopes array is empty.
        if (scopes.length < 1) {
            throw ClientConfigurationError.createEmptyScopesArrayError(scopes);
        }
    }

    /**
     * This method is responsible for requesting and returning an authorization code
     * from the authorization endpoint of the authorization server.
     * @param authorityInstance
     * @param scopes
     */
    private async retrieveAuthCode(authorityInstance: Authority, scopes: string[]): Promise<string> {
        // Register custom protocol to listen for auth code response
        this.listenOnCustomProtocol();

        // Build Server Authentication Request
        const authCodeRequestParameters = new AuthorizationCodeRequestParameters(
            authorityInstance,
            this.clientId,
            this.redirectUri,
            scopes
        );

        // Create navigate URL string from request parameters
        const navigateUrl = authCodeRequestParameters.buildRequestUrl();

        // Open PopUp window and load the navigate URL
        this.openAuthWindow();
        this.authWindow.loadURL(navigateUrl);
        return await this.listenForAuthCode();
    }

    /**
     * Creates a listener for 'will-redirect' event on the
     * auth window and returns the authorization code from the
     * server's response.
     */
    private async listenForAuthCode(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.authWindow.webContents.on('will-redirect', (event, responseUrl) => {
                const response = url.parse(responseUrl, true);
                if (response.query.error) {
                    const errorDescription = response.query.error_description as string;
                    const authError = AuthorizationCodeRequestError.createAuthCodeAccessDeniedError(errorDescription);
                    reject(authError);
                }
                resolve(response.query.code as string);
                this.authWindow.close();
            });
        });
    }

    /**
     * Registers a custom file protocol on which the library will
     * listen for Auth Code response.
     */
    private listenOnCustomProtocol(): void {
        protocol.registerFileProtocol(
            'msal',
            (req, callback) => {
                const requestUrl = url.parse(req.url, true);
                callback(path.normalize(`${__dirname}/${requestUrl.path}`));
            },
            (error) => {
                if (error) {
                    console.error(
                        `Error: Failed to register custom protocol 'msal'.`
                    );
                }
            });
    }

    /**
     * This mehtod opens a PopUp browser window that will
     * be used to authenticate the user.
     */
    private openAuthWindow() {
        this.authWindow = new BrowserWindow({
            height: DEFAULT_POPUP_HEIGHT,
            width: DEFAULT_POPUP_WIDTH,
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
