/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { Authority } from "./Authority";
import { Logger } from "./Logger";
import { Storage } from "./Storage";
import { TokenResponse } from "./RequestInfo";
import { User } from "./User";
declare global {
    interface Window {
        msal: Object;
        CustomEvent: CustomEvent;
        Event: Event;
        activeRenewals: {};
        renewStates: Array<string>;
        callBackMappedToRenewStates: {};
        callBacksMappedToRenewStates: {};
        openedWindows: Array<Window>;
        requestType: string;
    }
}
/**
 * @hidden
 */
export interface CacheResult {
    errorDesc: string;
    token: string;
    error: string;
}
/**
 * A type alias of for a tokenReceivedCallback function.
 * @param tokenReceivedCallback.errorDesc error description returned from the STS if API call fails.
 * @param tokenReceivedCallback.token token returned from STS if token request is successful.
 * @param tokenReceivedCallback.error error code returned from the STS if API call fails.
 * @param tokenReceivedCallback.tokenType tokenType returned from the STS if API call is successful. Possible values are: id_token OR access_token.
 */
export declare type tokenReceivedCallback = (errorDesc: string, token: string, error: string, tokenType: string, userState: string) => void;
export declare class UserAgentApplication {
    /**
     * @hidden
     */
    private _cacheLocations;
    /**
     * @hidden
     */
    private _cacheLocation;
    /**
     * Used to get the cache location
     */
    readonly cacheLocation: string;
    /**
     * @hidden
     */
    protected _logger: Logger;
    /**
     * @hidden
     */
    private _loginInProgress;
    /**
     * @hidden
     */
    private _acquireTokenInProgress;
    /**
     * @hidden
     */
    private _clockSkew;
    /**
     * @hidden
     */
    protected _cacheStorage: Storage;
    /**
     * @hidden
     */
    private _tokenReceivedCallback;
    /**
     * @hidden
     */
    private _user;
    /**
     * Client ID assigned to your app by Azure Active Directory.
     */
    clientId: string;
    /**
     * @hidden
     */
    protected authorityInstance: Authority;
    /**
     * Used to set the authority.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
     * - Default value is: "https://login.microsoftonline.com/common"
     */
    /**
    * Used to get the authority.
    */
    authority: string;
    /**
     * Used to turn authority validation on/off.
     * When set to true (default), MSAL will compare the application"s authority against well-known URLs templates representing well-formed authorities. It is useful when the authority is obtained at run time to prevent MSAL from displaying authentication prompts from malicious pages.
     */
    validateAuthority: boolean;
    /**
     * The redirect URI of the application, this should be same as the value in the application registration portal.
     * Defaults to `window.location.href`.
     */
    private _redirectUri;
    /**
     * Use to send the state parameter with authentication request
     */
    private _state;
    /**
     * Used to redirect the user to this location after logout.
     * Defaults to `window.location.href`.
     */
    private _postLogoutredirectUri;
    loadFrameTimeout: number;
    protected _navigateToLoginRequestUrl: boolean;
    private _isAngular;
    private _protectedResourceMap;
    private _unprotectedResources;
    private storeAuthStateInCookie;
    private _silentAuthenticationState;
    private _silentLogin;
    /**
     * Initialize a UserAgentApplication with a given clientId and authority.
     * @constructor
     * @param {string} clientId - The clientID of your application, you should get this from the application registration portal.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://&lt;instance>/&lt;tenant&gt;,\ where &lt;instance&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenantId&gt;/&lt;policyName&gt;/
     * - Default value is: "https://login.microsoftonline.com/common"
     * @param _tokenReceivedCallback -  The function that will get the call back once this API is completed (either successfully or with a failure).
     * @param {boolean} validateAuthority -  boolean to turn authority validation on/off.
     */
    constructor(clientId: string, authority: string | null, tokenReceivedCallback: tokenReceivedCallback, options?: {
        validateAuthority?: boolean;
        cacheLocation?: string;
        redirectUri?: string | (() => string);
        postLogoutRedirectUri?: string | (() => string);
        logger?: Logger;
        loadFrameTimeout?: number;
        navigateToLoginRequestUrl?: boolean;
        state?: string;
        isAngular?: boolean;
        unprotectedResources?: Array<string>;
        protectedResourceMap?: Map<string, Array<string>>;
        storeAuthStateInCookie?: boolean;
    });
    /**
     * Used to call the constructor callback with the token/error
     * @param {string} [hash=window.location.hash] - Hash fragment of Url.
     * @hidden
     */
    private processCallBack;
    /**
     * Used to get the redirect uri. Evaluates redirectUri if its a function, otherwise simply returns its value.
     * @ignore
     * @hidden
     */
    private getRedirectUri;
    /**
     * Used to get the post logout redirect uri. Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
     * @ignore
     * @hidden
     */
    private getPostLogoutRedirectUri;
    /**
     * Initiate the login process by redirecting the user to the STS authorization endpoint.
     * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are guaranteed to be included in the access token returned.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the authentication server during the interactive authentication flow.
     */
    loginRedirect(scopes?: Array<string>, extraQueryParameters?: string): void;
    private loginRedirectHelper;
    /**
     * Initiate the login process by opening a popup window.
     * @param {Array.<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token returned.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the interactive authentication flow.
     * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
     */
    loginPopup(scopes?: Array<string>, extraQueryParameters?: string): Promise<string>;
    private loginPopupHelper;
    /**
      * Used to redirect the browser to the STS authorization endpoint
      * @param {string} urlNavigate - URL of the authorization endpoint
      * @hidden
      */
    private promptUser;
    /**
     * Used to send the user to the redirect_uri after authentication is complete. The user"s bearer token is attached to the URI fragment as an id_token/access_token field.
     * This function also closes the popup window after redirection.
     * @hidden
     * @ignore
     */
    private openWindow;
    private broadcast;
    /**
     * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Defaults behaviour is to redirect the user to `window.location.href`.
     */
    logout(): void;
    /**
     * Used to configure the popup window for login.
     * @ignore
     * @hidden
     */
    protected clearCache(): void;
    protected clearCacheForScope(accessToken: string): void;
    /**
     * Configures popup window for login.
     * @ignore
     * @hidden
     */
    private openPopup;
    /**
     * Used to validate the scopes input parameter requested  by the developer.
     * @param {Array<string>} scopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
     * @ignore
     * @hidden
     */
    private validateInputScope;
    /**
      * Used to remove openid and profile from the list of scopes passed by the developer.These scopes are added by default
      * @hidden
      */
    private filterScopes;
    /**
     * Used to add the developer requested callback to the array of callbacks for the specified scopes. The updated array is stored on the window object
     * @param {string} scope - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
     * @param {string} expectedState - Unique state identifier (guid).
     * @param {Function} resolve - The resolve function of the promise object.
     * @param {Function} reject - The reject function of the promise object.
     * @ignore
     * @hidden
     */
    private registerCallback;
    protected getCachedTokenInternal(scopes: Array<string>, user: User): CacheResult;
    /**
     * Used to get token for the specified set of scopes from the cache
     * @param {AuthenticationRequestParameters} authenticationRequest - Request sent to the STS to obtain an id_token/access_token
     * @param {User} user - User for which the scopes were requested
     * @hidden
     */
    private getCachedToken;
    /**
     * Used to filter all cached items and return a list of unique users based on userIdentifier.
     * @param {Array<User>} Users - users saved in the cache.
     */
    getAllUsers(): Array<User>;
    /**
     * Used to filter users based on userIdentifier
     * @param {Array<User>}  Users - users saved in the cache
     * @ignore
     * @hidden
     */
    private getUniqueUsers;
    /**
    * Used to get a unique list of authoritues from the cache
    * @param {Array<AccessTokenCacheItem>}  accessTokenCacheItems - accessTokenCacheItems saved in the cache
    * @ignore
    * @hidden
    */
    private getUniqueAuthority;
    /**
     * Adds login_hint to authorization URL which is used to pre-fill the username field of sign in page for the user if known ahead of time
     * domain_hint can be one of users/organisations which when added skips the email based discovery process of the user
     * domain_req utid received as part of the clientInfo
     * login_req uid received as part of clientInfo
     * @param {string} urlNavigate - Authentication request url
     * @param {User} user - User for which the token is requested
     * @ignore
     * @hidden
     */
    private addHintParameters;
    /**
     * Checks if the authorization endpoint URL contains query string parameters
     * @ignore
     * @hidden
     */
    private urlContainsQueryStringParameter;
    /**
     * Used to obtain an access_token by redirecting the user to the authorization endpoint.
     * To renew idToken, clientId should be passed as the only scope in the scopes array.
     * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://{instance}/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://{instance}/tfp/&lt;tenant&gt;/<policyName>
     * - Default value is: "https://login.microsoftonline.com/common"
     * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
     */
    acquireTokenRedirect(scopes: Array<string>): void;
    acquireTokenRedirect(scopes: Array<string>, authority: string): void;
    acquireTokenRedirect(scopes: Array<string>, authority: string, user: User): void;
    acquireTokenRedirect(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): void;
    /**
     * Used to acquire an access token for a new user using interactive authentication via a popup Window.
     * To request an id_token, pass the clientId as the only scope in the scopes array.
     * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
     * - Default value is: "https://login.microsoftonline.com/common".
     * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
     * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the token or error.
     */
    acquireTokenPopup(scopes: Array<string>): Promise<string>;
    acquireTokenPopup(scopes: Array<string>, authority: string): Promise<string>;
    acquireTokenPopup(scopes: Array<string>, authority: string, user: User): Promise<string>;
    acquireTokenPopup(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): Promise<string>;
    /**
     * Used to get the token from cache.
     * MSAL will return the cached token if it is not expired.
     * Or it will send a request to the STS to obtain an access_token using a hidden iframe. To renew idToken, clientId should be passed as the only scope in the scopes array.
     * @param {Array<string>} scopes - Permissions you want included in the access token. Not all scopes are  guaranteed to be included in the access token. Scopes like "openid" and "profile" are sent with every request.
     * @param {string} authority - A URL indicating a directory that MSAL can use to obtain tokens.
     * - In Azure AD, it is of the form https://&lt;tenant&gt;/&lt;tenant&gt;, where &lt;tenant&gt; is the directory host (e.g. https://login.microsoftonline.com) and &lt;tenant&gt; is a identifier within the directory itself (e.g. a domain associated to the tenant, such as contoso.onmicrosoft.com, or the GUID representing the TenantID property of the directory)
     * - In Azure B2C, it is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/<policyName>/
     * - Default value is: "https://login.microsoftonline.com/common"
     * @param {User} user - The user for which the scopes are requested.The default user is the logged in user.
     * @param {string} extraQueryParameters - Key-value pairs to pass to the STS during the  authentication flow.
     * @returns {Promise.<string>} - A Promise that is fulfilled when this function has completed, or rejected if an error was raised. Resolved with token or rejected with error.
     */
    acquireTokenSilent(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string>;
    private extractADALIdToken;
    /**
     * Calling _loadFrame but with a timeout to signal failure in loadframeStatus. Callbacks are left.
     * registered when network errors occur and subsequent token requests for same resource are registered to the pending request.
     * @ignore
     * @hidden
     */
    private loadIframeTimeout;
    /**
     * Loads iframe with authorization endpoint URL
     * @ignore
     * @hidden
     */
    private loadFrame;
    /**
     * Adds the hidden iframe for silent token renewal.
     * @ignore
     * @hidden
     */
    private addAdalFrame;
    /**
     * Acquires access token using a hidden iframe.
     * @ignore
     * @hidden
     */
    private renewToken;
    /**
     * Renews idtoken for app"s own backend when clientId is passed as a single scope in the scopes array.
     * @ignore
     * @hidden
     */
    private renewIdToken;
    /**
      * Returns the signed in user (received from a user object created at the time of login) or null.
      */
    getUser(): User;
    /**
     * This method must be called for processing the response received from the STS. It extracts the hash, processes the token or error information and saves it in the cache. It then
     * calls the registered callbacks in case of redirect or resolves the promises with the result.
     * @param {string} [hash=window.location.hash] - Hash fragment of Url.
     * @hidden
     */
    private handleAuthenticationResponse;
    /**
     * This method must be called for processing the response received from AAD. It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
     * @param {string} authority authority received in the redirect response from AAD.
     * @param {TokenResponse} requestInfo an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
     * @param {User} user user object for which scopes are consented for. The default user is the logged in user.
     * @param {ClientInfo} clientInfo clientInfo received as part of the response comprising of fields uid and utid.
     * @param {IdToken} idToken idToken received as part of the response.
     * @ignore
     * @private
     * @hidden
     */
    private saveAccessToken;
    /**
     * Saves token or error received in the response from AAD in the cache. In case of id_token, it also creates the user object.
     * @ignore
     * @hidden
     */
    protected saveTokenFromHash(tokenResponse: TokenResponse): void;
    /**
     * Checks if the redirect response is received from the STS. In case of redirect, the url fragment has either id_token, access_token or error.
     * @param {string} hash - Hash passed from redirect page.
     * @returns {Boolean} - true if response contains id_token, access_token or error, false otherwise.
     * @hidden
     */
    isCallback(hash: string): boolean;
    /**
     * Returns the anchor part(#) of the URL
     * @ignore
     * @hidden
     */
    private getHash;
    /**
      * Creates a requestInfo object from the URL fragment and returns it.
      * @param {string} hash  -  Hash passed from redirect page
      * @returns {TokenResponse} an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
      * @ignore
      * @hidden
      */
    protected getRequestInfo(hash: string): TokenResponse;
    /**
      * Extracts scope value from the state sent with the authentication request.
      * @returns {string} scope.
      * @ignore
      * @hidden
      */
    private getScopeFromState;
    /**
    * Extracts state value from the userState sent with the authentication request.
    * @returns {string} scope.
    * @ignore
    * @hidden
    */
    getUserState(state: string): string;
    /**
      * Returns whether current window is in ifram for token renewal
      * @ignore
      * @hidden
      */
    private isInIframe;
    loginInProgress(): boolean;
    private getHostFromUri;
    protected getScopesForEndpoint(endpoint: string): Array<string>;
    protected setloginInProgress(loginInProgress: boolean): void;
    protected getAcquireTokenInProgress(): boolean;
    protected setAcquireTokenInProgress(acquireTokenInProgress: boolean): void;
    protected getLogger(): Logger;
}
