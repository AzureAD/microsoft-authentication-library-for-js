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
export interface CacheResult {
    errorDesc: string;
    token: string;
    error: string;
}
export declare type tokenReceivedCallback = (errorDesc: string, token: string, error: string, tokenType: string, userState: string) => void;
export declare class UserAgentApplication {
    private _cacheLocations;
    private _cacheLocation;
    readonly cacheLocation: string;
    protected _logger: Logger;
    private _loginInProgress;
    private _acquireTokenInProgress;
    private _clockSkew;
    protected _cacheStorage: Storage;
    private _tokenReceivedCallback;
    private _user;
    clientId: string;
    protected authorityInstance: Authority;
    /*
    * Used to get the authority.
    */
    authority: string;
    validateAuthority: boolean;
    private _redirectUri;
    private _state;
    private _postLogoutredirectUri;
    loadFrameTimeout: number;
    protected _navigateToLoginRequestUrl: boolean;
    private _isAngular;
    private _protectedResourceMap;
    private _unprotectedResources;
    private storeAuthStateInCookie;
    constructor(clientId: string, authority: string | null, tokenReceivedCallback: tokenReceivedCallback, options?: {
        validateAuthority?: boolean;
        cacheLocation?: string;
        redirectUri?: string;
        postLogoutRedirectUri?: string;
        logger?: Logger;
        loadFrameTimeout?: number;
        navigateToLoginRequestUrl?: boolean;
        state?: string;
        isAngular?: boolean;
        unprotectedResources?: Array<string>;
        protectedResourceMap?: Map<string, Array<string>>;
        storeAuthStateInCookie?: boolean;
    });
    private processCallBack;
    loginRedirect(scopes?: Array<string>, extraQueryParameters?: string): void;
    loginPopup(scopes: Array<string>, extraQueryParameters?: string): Promise<string>;
    private promptUser;
    private openWindow;
    private broadcast;
    logout(): void;
    protected clearCache(): void;
    protected clearCacheForScope(accessToken: string): void;
    private openPopup;
    private validateInputScope;
    private filterScopes;
    private registerCallback;
    protected getCachedTokenInternal(scopes: Array<string>, user: User): CacheResult;
    private getCachedToken;
    getAllUsers(): Array<User>;
    private getUniqueUsers;
    private getUniqueAuthority;
    private addHintParameters;
    private urlContainsQueryStringParameter;
    acquireTokenRedirect(scopes: Array<string>): void;
    acquireTokenRedirect(scopes: Array<string>, authority: string): void;
    acquireTokenRedirect(scopes: Array<string>, authority: string, user: User): void;
    acquireTokenRedirect(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): void;
    acquireTokenPopup(scopes: Array<string>): Promise<string>;
    acquireTokenPopup(scopes: Array<string>, authority: string): Promise<string>;
    acquireTokenPopup(scopes: Array<string>, authority: string, user: User): Promise<string>;
    acquireTokenPopup(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): Promise<string>;
    acquireTokenSilent(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string>;
    private loadIframeTimeout;
    private loadFrame;
    private addAdalFrame;
    private renewToken;
    private renewIdToken;
    getUser(): User;
    private handleAuthenticationResponse;
    private saveAccessToken;
    protected saveTokenFromHash(tokenResponse: TokenResponse): void;
    isCallback(hash: string): boolean;
    private getHash;
    protected getRequestInfo(hash: string): TokenResponse;
    private getScopeFromState;
    getUserState(state: string): string;
    private isInIframe;
    loginInProgress(): boolean;
    private getHostFromUri;
    protected getScopesForEndpoint(endpoint: string): Array<string>;
    protected setloginInProgress(loginInProgress: boolean): void;
    protected getAcquireTokenInProgress(): boolean;
    protected setAcquireTokenInProgress(acquireTokenInProgress: boolean): void;
    protected getLogger(): Logger;
}
