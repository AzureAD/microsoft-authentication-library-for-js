declare namespace Msal {
    enum AuthorityType {
        Aad = 0,
        Adfs = 1,
        B2C = 2,
    }
    abstract class Authority {
        protected constructor(authority: string, validateAuthority: boolean);
        readonly abstract AuthorityType: AuthorityType;
        IsValidationEnabled: boolean;
        readonly Tenant: string;
        private tenantDiscoveryResponse;
        readonly AuthorizationEndpoint: string;
        readonly EndSessionEndpoint: string;
        readonly SelfSignedJwtAudience: string;
        private validateResolved();
        CanonicalAuthority: string;
        private canonicalAuthority;
        private canonicalAuthorityUrlComponents;
        readonly CanonicalAuthorityUrlComponents: IUri;
        protected readonly DefaultOpenIdConfigurationEndpoint: string;
        private validateAsUri();
        private static DetectAuthorityFromUrl(authorityUrl);
        static CreateInstance(authorityUrl: string, validateAuthority: boolean): Authority;
        private DiscoverEndpoints(openIdConfigurationEndpoint);
        ResolveEndpointsAsync(): Promise<Authority>;
        abstract GetOpenIdConfigurationEndpointAsync(): Promise<string>;
    }
}
declare namespace Msal {
    class AadAuthority extends Authority {
        private static readonly AadInstanceDiscoveryEndpoint;
        private readonly AadInstanceDiscoveryEndpointUrl;
        constructor(authority: string, validateAuthority: boolean);
        readonly AuthorityType: AuthorityType;
        private static readonly TrustedHostList;
        GetOpenIdConfigurationEndpointAsync(): Promise<string>;
        IsInTrustedHostList(host: string): boolean;
    }
}
declare namespace Msal {
    class AccessTokenCacheItem {
        key: AccessTokenKey;
        value: AccessTokenValue;
        constructor(key: AccessTokenKey, value: AccessTokenValue);
    }
}
declare namespace Msal {
    class AccessTokenKey {
        authority: string;
        clientId: string;
        userIdentifier: string;
        scopes: string;
        constructor(authority: string, clientId: string, scopes: string, uid: string, utid: string);
    }
}
declare namespace Msal {
    class AccessTokenValue {
        accessToken: string;
        idToken: string;
        expiresIn: string;
        clientInfo: string;
        constructor(accessToken: string, idToken: string, expiresIn: string, clientInfo: string);
    }
}
declare namespace Msal {
    class AuthenticationRequestParameters {
        authorityInstance: Authority;
        clientId: string;
        nonce: string;
        state: string;
        correlationId: string;
        xClientVer: string;
        xClientSku: string;
        scopes: Array<string>;
        responseType: string;
        promptValue: string;
        extraQueryParameters: string;
        loginHint: string;
        domainHint: string;
        redirectUri: string;
        readonly authority: string;
        constructor(authority: Authority, clientId: string, scope: Array<string>, responseType: string, redirectUri: string);
        createNavigateUrl(scopes: Array<string>): string;
        translateclientIdUsedInScope(scopes: Array<string>): void;
        parseScope(scopes: Array<string>): string;
    }
}
declare namespace Msal {
    class B2cAuthority extends AadAuthority {
        constructor(authority: string, validateAuthority: boolean);
        readonly AuthorityType: AuthorityType;
        GetOpenIdConfigurationEndpointAsync(): Promise<string>;
    }
}
declare namespace Msal {
    class ClientInfo {
        private _uid;
        uid: string;
        private _utid;
        utid: string;
        constructor(rawClientInfo: string);
    }
}
declare namespace Msal {
    class Constants {
        static readonly errorDescription: string;
        static readonly error: string;
        static readonly scope: string;
        static readonly acquireTokenUser: string;
        static readonly clientInfo: string;
        static readonly clientId: string;
        static readonly authority: string;
        static readonly idToken: string;
        static readonly accessToken: string;
        static readonly expiresIn: string;
        static readonly sessionState: string;
        static readonly tokenKeys: string;
        static readonly accessTokenKey: string;
        static readonly expirationKey: string;
        static readonly stateLogin: string;
        static readonly stateAcquireToken: string;
        static readonly stateRenew: string;
        static readonly nonceIdToken: string;
        static readonly userName: string;
        static readonly idTokenKey: string;
        static readonly loginRequest: string;
        static readonly loginError: string;
        static readonly renewStatus: string;
        static readonly resourceDelimeter: string;
        private static _loadFrameTimeout;
        static loadFrameTimeout: number;
        static readonly tokenRenewStatusCancelled: string;
        static readonly tokenRenewStatusCompleted: string;
        static readonly tokenRenewStatusInProgress: string;
        private static _popUpWidth;
        static popUpWidth: number;
        private static _popUpHeight;
        static popUpHeight: number;
        static readonly login: string;
        static readonly renewToken: string;
        static readonly unknown: string;
    }
    class ErrorCodes {
        static readonly loginProgressError: string;
        static readonly acquireTokenProgressError: string;
        static readonly inputScopesError: string;
        static readonly endpointResolutionError: string;
        static readonly popUpWindowError: string;
        static readonly userLoginError: string;
    }
    class ErrorDescription {
        static readonly loginProgressError: string;
        static readonly acquireTokenProgressError: string;
        static readonly inputScopesError: string;
        static readonly endpointResolutionError: string;
        static readonly popUpWindowError: string;
        static readonly userLoginError: string;
    }
}
declare namespace Msal {
    class ErrorMessage {
        static readonly authorityUriInvalidPath: string;
        static readonly authorityUriInsecure: string;
        static readonly invalidAuthorityType: string;
        static readonly unsupportedAuthorityValidation: string;
        static readonly b2cAuthorityUriInvalidPath: string;
    }
}
declare namespace Msal {
    class IdToken {
        rawIdToken: string;
        issuer: string;
        objectId: string;
        subject: string;
        tenantId: string;
        version: string;
        preferredName: string;
        name: string;
        homeObjectId: string;
        nonce: string;
        expiration: string;
        constructor(rawIdToken: string);
    }
}
declare namespace Msal {
    interface IInstanceDiscoveryResponse {
        TenantDiscoveryEndpoint: string;
    }
}
declare namespace Msal {
    interface ITenantDiscoveryResponse {
        AuthorizationEndpoint: string;
        EndSessionEndpoint: string;
        Issuer: string;
    }
}
declare namespace Msal {
    interface IUri {
        Protocol: string;
        HostNameAndPort: string;
        AbsolutePath: string;
        Search: string;
        Hash: string;
        PathSegments: string[];
    }
}
declare namespace Msal {
    interface ILoggerCallback {
        (level: LogLevel, message: string, containsPii: boolean): void;
    }
    enum LogLevel {
        Error = 0,
        Warning = 1,
        Info = 2,
        Verbose = 3,
    }
    class Logger {
        private static _instance;
        private _correlationId;
        correlationId: string;
        private _level;
        level: LogLevel;
        private _piiLoggingEnabled;
        piiLoggingEnabled: boolean;
        private _localCallback;
        localCallback: ILoggerCallback;
        constructor(correlationId: string);
        private logMessage(logMessage, logLevel, containsPii);
        executeCallback(level: LogLevel, message: string, containsPii: boolean): void;
        error(message: string): void;
        errorPii(message: string): void;
        warning(message: string): void;
        warningPii(message: string): void;
        info(message: string): void;
        infoPii(message: string): void;
        verbose(message: string): void;
        verbosePii(message: string): void;
    }
}
declare namespace Msal {
    class RequestContext {
        private static _instance;
        private _correlationId;
        readonly correlationId: string;
        private _logger;
        readonly logger: Logger;
        constructor(correlationId: string);
    }
}
declare namespace Msal {
    class TokenResponse {
        valid: boolean;
        parameters: Object;
        stateMatch: boolean;
        stateResponse: string;
        requestType: string;
        constructor();
    }
}
declare namespace Msal {
    class Storage {
        private static _instance;
        private _localStorageSupported;
        private _sessionStorageSupported;
        private _cacheLocation;
        constructor(cacheLocation: string);
        setItem(key: string, value: string): void;
        getItem(key: string): string;
        removeItem(key: string): void;
        clear(): void;
        getAllAccessTokens(clientId: string, userIdentifier: string): Array<AccessTokenCacheItem>;
        removeAcquireTokenEntries(acquireTokenUser: string, acquireTokenStatus: string): void;
        resetCacheItems(): void;
    }
}
declare namespace Msal {
    class Telemetry {
        private static instance;
        private receiverCallback;
        constructor();
        RegisterReceiver(receiverCallback: (receiver: Array<Object>) => void): void;
        static GetInstance(): Telemetry;
    }
}
declare namespace Msal {
    class User {
        displayableId: string;
        name: string;
        identityProvider: string;
        userIdentifier: string;
        constructor(displayableId: string, name: string, identityProvider: string, userIdentifier: string);
        static createUser(idToken: IdToken, clientInfo: ClientInfo, authority: string): User;
    }
}
declare namespace Msal {
    type tokenReceivedCallback = (errorDesc: string, token: string, error: string, tokenType: string) => void;
    class UserAgentApplication {
        private _cacheLocations;
        private _cacheLocation;
        cacheLocation: string;
        private _interactionModes;
        private _interactionMode;
        private _requestContext;
        private _loginInProgress;
        private _acquireTokenInProgress;
        private _renewStates;
        private _activeRenewals;
        private _clockSkew;
        private _cacheStorage;
        private _tokenReceivedCallback;
        private _user;
        clientId: string;
        private authorityInstance;
        authority: string;
        validateAuthority: boolean;
        redirectUri: string;
        postLogoutredirectUri: string;
        navigateToLoginRequestUrl: boolean;
        constructor(clientId: string, authority: string, tokenReceivedCallback: tokenReceivedCallback, validateAuthority?: boolean);
        loginRedirect(scopes?: Array<string>, extraQueryParameters?: string): void;
        loginPopup(scopes: Array<string>, extraQueryParameters?: string): Promise<string>;
        private promptUser(urlNavigate);
        private openWindow(urlNavigate, title, interval, instance, resolve?, reject?);
        logout(): void;
        private clearCache();
        private openPopup(urlNavigate, title, popUpWidth, popUpHeight);
        private validateInputScope(scopes);
        private filterScopes(scopes);
        private registerCallback(expectedState, scope, resolve, reject);
        private getCachedToken(authenticationRequest, user);
        getAllUsers(): Array<User>;
        private getUniqueUsers(users);
        private getUniqueAuthority(accessTokenCacheItems, property);
        private addHintParameters(urlNavigate, user);
        private urlContainsQueryStringParameter(name, url);
        acquireTokenRedirect(scopes: Array<string>): void;
        acquireTokenRedirect(scopes: Array<string>, authority: string): void;
        acquireTokenRedirect(scopes: Array<string>, authority: string, user: User): void;
        acquireTokenRedirect(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): void;
        acquireTokenPopup(scopes: Array<string>): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority: string): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority: string, user: User): Promise<string>;
        acquireTokenPopup(scopes: Array<string>, authority: string, user: User, extraQueryParameters: string): Promise<string>;
        acquireTokenSilent(scopes: Array<string>, authority?: string, user?: User, extraQueryParameters?: string): Promise<string>;
        private loadFrameTimeout(urlNavigate, frameName, scope);
        private loadFrame(urlNavigate, frameName);
        private addAdalFrame(iframeId);
        private renewToken(scopes, resolve, reject, user, authenticationRequest, extraQueryParameters?);
        private renewIdToken(scopes, resolve, reject, user, authenticationRequest, extraQueryParameters?);
        getUser(): User;
        handleAuthenticationResponse(hash: string, resolve?: Function, reject?: Function): void;
        private saveAccessToken(authority, tokenResponse, user, clientInfo, idToken);
        private saveTokenFromHash(tokenResponse);
        isCallback(hash: string): boolean;
        private getHash(hash);
        private getRequestInfo(hash);
        private getScopeFromState(state);
    }
}
declare namespace Msal {
    class Utils {
        static compareObjects(u1: User, u2: User): boolean;
        static expiresIn(expires: string): number;
        static now(): number;
        static isEmpty(str: string): boolean;
        static extractIdToken(encodedIdToken: string): any;
        static base64EncodeStringUrlSafe(input: string): string;
        static base64DecodeStringUrlSafe(base64IdToken: string): string;
        static encode(input: string): string;
        static utf8Encode(input: string): string;
        static decode(base64IdToken: string): string;
        static decodeJwt(jwtToken: string): any;
        static deserialize(query: string): any;
        static isIntersectingScopes(cachedScopes: Array<string>, scopes: Array<string>): boolean;
        static containsScope(cachedScopes: Array<string>, scopes: Array<string>): boolean;
        static convertToLowerCase(scopes: Array<string>): Array<string>;
        static removeElement(scopes: Array<string>, scope: string): Array<string>;
        static decimalToHex(num: number): string;
        static getLibraryVersion(): string;
        static replaceFirstPath(href: string, tenantId: string): string;
        static createNewGuid(): string;
        static GetUrlComponents(url: string): IUri;
        static CanonicalizeUri(url: string): string;
        static endsWith(url: string, suffix: string): boolean;
    }
}
interface Window {
    msal: Object;
    callBackMappedToRenewStates: Object;
    callBacksMappedToRenewStates: Object;
}
declare namespace Msal {
    class XhrClient {
        sendRequestAsync(url: string, method: string, enableCaching?: boolean): Promise<any>;
        protected handleError(responseText: string): any;
    }
}
