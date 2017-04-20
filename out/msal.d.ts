declare namespace MSAL {
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
        readonly Host: string;
        readonly AuthorizationEndpoint: string;
        readonly TokenEndpoint: string;
        readonly SelfSignedJwtAudience: string;
        private validateResolved();
        CanonicalAuthority: string;
        private canonicalAuthority;
        private canonicalAuthorityUrlComponents;
        protected readonly CanonicalAuthorityUrlComponents: IUri;
        protected readonly DefaultOpenIdConfigurationEndpoint: string;
        private static validateAsUri(uri);
        private static DetectAuthorityFromUrl(authorityUrl);
        static CreateInstance(authorityUrl: string, validateAuthority: boolean): Authority;
        private DiscoverEndpoints(openIdConfigurationEndpoint);
        protected sendRequestAsync(url: string, method: string, enableCaching?: boolean): Promise<any>;
        ResolveEndpointsAsync(): Promise<Authority>;
        abstract GetOpenIdConfigurationEndpointAsync(): Promise<string>;
    }
}
declare namespace MSAL {
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
declare namespace MSAL {
    class AccessTokenCacheItem {
        key: AccessTokenKey;
        value: AccessTokenValue;
        constructor(key: AccessTokenKey, value: AccessTokenValue);
    }
}
declare namespace MSAL {
    class AccessTokenKey {
        authority: string;
        clientId: string;
        userIdentifier: string;
        Scopes: string;
        constructor(authority: string, clientId: string, scopes: string, userIdentifier: string);
    }
}
declare namespace MSAL {
    class AccessTokenValue {
        AccessToken: string;
        ExpiresIn: string;
        constructor(accessToken: string, expiresIn: string);
    }
}
declare namespace MSAL {
    enum ResponseTypes {
        id_token = 0,
        token = 1,
    }
    class AuthenticationRequestParameters {
        authority: string;
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
        constructor(authority: string, clientId: string, scope: Array<string>, responseType: string, redirectUri: string);
        CreateNavigateUrl(scopes: Array<string>): string;
        translateclientIdUsedInScope(scopes: Array<string>): void;
        parseScope(scopes: Array<string>): string;
    }
}
declare namespace MSAL {
    class B2cAuthority extends AadAuthority {
        constructor(authority: string, validateAuthority: boolean);
        readonly AuthorityType: AuthorityType;
        GetOpenIdConfigurationEndpointAsync(): Promise<string>;
    }
}
declare namespace MSAL {
    class Constants {
        static readonly errorDescription: string;
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
        static readonly error: string;
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
}
declare namespace MSAL {
    interface IInstanceDiscoveryResponse {
        TenantDiscoveryEndpoint: string;
    }
}
declare namespace MSAL {
    interface ITenantDiscoveryResponse {
        AuthorizationEndpoint: string;
        TokenEndpoint: string;
        Issuer: string;
    }
}
declare namespace MSAL {
    interface IUri {
        Protocol: string;
        HostNameAndPort: string;
        AbsolutePath: string;
        Search: string;
        Hash: string;
        PathSegments: string[];
    }
}
declare namespace MSAL {
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
        private LogMessage(logMessage, logLevel, containsPii);
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
declare namespace MSAL {
    class RequestContext {
        private static _instance;
        private _correlationId;
        readonly correlationId: string;
        private _logger;
        readonly logger: Logger;
        constructor(correlationId: string);
    }
}
declare namespace MSAL {
    class RequestInfo {
        valid: boolean;
        parameters: Object;
        stateMatch: boolean;
        stateResponse: string;
        requestType: string;
        constructor();
    }
}
declare namespace MSAL {
    class Storage {
        private static _instance;
        private _localStorageSupported;
        private _sessionStorageSupported;
        private _cacheLocation;
        constructor(cacheLocation: string);
        saveItem(key: string, value: string): void;
        getItem(key: string): string;
        removeItem(key: string): void;
        clear(): void;
        getAllAccessTokens(clientId: string, authority: string): Array<AccessTokenCacheItem>;
    }
}
declare namespace MSAL {
    class Telemetry {
        private static instance;
        private receiverCallback;
        private constructor();
        RegisterReceiver(receiverCallback: (receiver: Array<Object>) => void): void;
        static GetInstance(): Telemetry;
    }
}
declare namespace MSAL {
    interface User {
        username: string;
        profile: any;
    }
}
declare namespace MSAL {
    class UserAgentApplication {
        private _cacheLocations;
        private _cacheLocation;
        cacheLocation: string;
        private _interactionModes;
        private _interactionMode;
        interactionMode: string;
        private _requestContext;
        private _loginInProgress;
        private _acquireTokenInProgress;
        private _checkSessionIframe;
        private _renewStates;
        private _activeRenewals;
        private _clockSkew;
        private _cacheStorage;
        private _userCallback;
        user: User;
        clientId: string;
        authority: string;
        redirectUri: string;
        postLogoutredirectUri: string;
        correlationId: string;
        navigateToLoginRequestUrl: boolean;
        constructor(clientId: string, authority: string, userCallback: (errorDesc: string, token: string, error: string) => void);
        login(): void;
        private openConsentWindow(urlNavigate, title, interval, instance, callback);
        logout(): void;
        private clearCache();
        private openPopup(urlNavigate, title, popUpWidth, popUpHeight);
        private validateInputScope(scopes);
        private registerCallback(expectedState, scope, callback);
        private getCachedToken(scopes);
        private addHintParameters(urlNavigate, loginHint?);
        private urlContainsQueryStringParameter(name, url);
        acquireToken(scopes: Array<string>, callback: (errorDesc: string, token: string, error: string) => void): void;
        acquireToken(scopes: Array<string>, callback: (errorDesc: string, token: string, error: string) => void, loginHint: string): void;
        acquireToken(scopes: Array<string>, callback: (errorDesc: string, token: string, error: string) => void, loginHint: string, extraQueryParameters: string): void;
        acquireTokenSilent(scopes: Array<string>, callback: (errorDesc: string, token: string, error: string) => void): void;
        private loadFrameTimeout(urlNavigate, frameName, scope);
        private loadFrame(urlNavigate, frameName);
        private addAdalFrame(iframeId);
        private renewToken(scopes, callback);
        private renewIdToken(scopes, callback);
        private hasScope(key);
        getUser(): User;
        handleAuthenticationResponse(hash: string): void;
        private saveAccessToken(requestInfo);
        private saveTokenFromHash(requestInfo);
        isCallback(hash: string): boolean;
        private getHash(hash);
        private getRequestInfo(hash);
        private getScopeFromState(state);
        private createUser(idToken);
    }
}
declare namespace MSAL {
    class Utils {
        static expiresIn(expires: string): number;
        static now(): number;
        static isEmpty(str: string): boolean;
        static extractIdToken(encodedIdToken: string): any;
        static base64DecodeStringUrlSafe(base64IdToken: string): string;
        static decode(base64IdToken: string): string;
        static decodeJwt(jwtToken: string): any;
        static deserialize(query: string): any;
        static isIntersectingScopes(cachedScopes: Array<string>, scopes: Array<string>): boolean;
        static containsScope(cachedScopes: Array<string>, scopes: Array<string>): boolean;
        static DecimalToHex(num: number): string;
        static GetLibraryVersion(): string;
        static CreateNewGuid(): string;
        static GetUrlComponents(url: string): IUri;
        static CanonicalizeUri(url: string): string;
    }
}
interface Window {
    MSAL: Object;
    callBackMappedToRenewStates: Object;
    callBacksMappedToRenewStates: Object;
}
