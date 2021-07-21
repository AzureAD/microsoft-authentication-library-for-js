import { AccessTokenEntity, ICrypto, IdTokenEntity, Logger, Scopeet, ClientInfo, Authority, AuthorityOptions, ServerAuthorizationTokenResponse } from "@azure/msal-common";
import { BrowserConfiguration, buildConfiguration, Configuration } from "../config/Configuration";
import { SilentRequest } from "../request/SilentRequest";
import { BrowserCacheManager } from "./BrowserCacheManager";
import { ITokenCache } from "./ITokenCache";
import { BrowserAuthError } from "./../error/BrowserAuthError";

export type LoadTokenOptions = {
    accessToken?: string,
    clientInfo?: ClientInfo,
    response?: ServerAuthorizationTokenResponse,
    expiresOn?: number,
    extendedExpiresOn?: number,
    callback?: CallableFunction
}

export class TokenCache implements ITokenCache {
    protected config: BrowserConfiguration;
    protected isBrowserEnvironment: boolean;
    private storage: BrowserCacheManager;
    private logger: Logger;
    private cryptoObj: ICrypto;

    constructor(configuration: Configuration, storage: BrowserCacheManager, logger: Logger, cryptoObj: ICrypto) {
        this.isBrowserEnvironment = typeof window !== "undefined";
        this.config = buildConfiguration(configuration, this.isBrowserEnvironment);
        this.storage = storage;
        this.logger = logger;
        this.cryptoObj = cryptoObj;
    }
    
    // Move getAllAccounts here and cache utility APIs

    loadTokens(request: SilentRequest, idToken: string, options: LoadTokenOptions): void {
        this.logger.info("TokenCache - loading tokens");

        if (request.account) {
            this.loadIdToken(idToken, request.account.homeAccountId, request.account.environment, request.account.tenantId);

            if (options.accessToken) {
                this.loadAccessToken(request, options, request.account.homeAccountId, request.account.environment, request.account.tenantId);
            }
        } else if (request.authority && options.clientInfo) {
            const homeAccountId = `${options.clientInfo?.uid!}.${options.clientInfo?.utid!}`;

            const authorityOptions: AuthorityOptions = {
                protocolMode: this.config.auth.protocolMode,
                knownAuthorities: this.config.auth.knownAuthorities,
                cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
                authorityMetadata: this.config.auth.authorityMetadata
            };
            const authority = new Authority(request.authority!, this.config.system.networkClient, this.storage, authorityOptions)

            this.loadIdToken(idToken, homeAccountId, authority.hostnameAndPort, authority.tenant);

            if (options.accessToken) {
                this.loadAccessToken(request, options, homeAccountId, authority.hostnameAndPort, authority.tenant);
            }
        } else {
            throw BrowserAuthError.createUnableToLoadTokenError("Please provide a request with an account, or a request with authority and clientInfo.");
        }
    }

    private loadIdToken(idToken: string, homeAccountId: string, environment: string, tenantId: string): void {

        const idTokenEntity = IdTokenEntity.createIdTokenEntity(homeAccountId, environment, idToken, this.config.auth.clientId, tenantId);

        if (this.isBrowserEnvironment) {
            this.storage.setIdTokenCredential(idTokenEntity);
        } else {
            // Callback here
        }
    }

    private loadAccessToken(request: SilentRequest, options: LoadTokenOptions, homeAccountId: string, environment: string, tenantId: string): void {

        if (!options.response && !options.expiresOn || !options.response && !options.extendedExpiresOn) {
            throw BrowserAuthError.createUnableToLoadTokenError("Please provide either a server response or expiresOn and extendedExpiresOn values.");
        }

        if (options.response && !options.response?.expires_in || options.response && !options.response.ext_expires_in) {
            throw BrowserAuthError.createUnableToLoadTokenError("Response provided does not have token expiry. Please provide expiresOn and extendedExpiresOn values.")
        }
        
        const scopes = new ScopeSet(request.scopes).printScopes();
        const expiresOn = options.response? options.response.expires_in : options.expiresOn;
        const extendedExpiresOn = options.response? options.response.ext_expires_in : options.extendedExpiresOn;

        const accessTokenEntity = AccessTokenEntity.createAccessTokenEntity(homeAccountId, environment, options.accessToken!, this.config.auth.clientId, tenantId, scopes, expiresOn!, extendedExpiresOn!, this.cryptoObj);

        // Cache token to local/session storage if browser, otherwise provide callback
        if (this.isBrowserEnvironment) {
            this.storage.setAccessTokenCredential(accessTokenEntity);
        } else {
            // Callback here
        }
    }

}
