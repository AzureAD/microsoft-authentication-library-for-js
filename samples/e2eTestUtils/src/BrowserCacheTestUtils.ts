import * as puppeteer from "puppeteer";

export interface ServerTelemetryEntity {
    failedRequests: Array<string | number>;
    errors: string[];
    cacheHits: number;
}

export type tokenMap = {
    idTokens: string[];
    accessTokens: string[];
    refreshTokens: string[];
};

export class BrowserCacheUtils {
    private page: puppeteer.Page;
    private storageType: string;

    constructor(page: puppeteer.Page, storageType: string) {
        this.page = page;
        this.storageType = storageType;
    }

    getWindowStorage(): Promise<Storage> {
        if (this.storageType === "localStorage") {
            return this.page.evaluate(() =>
                Object.assign({}, window.localStorage)
            );
        } else {
            return this.page.evaluate(() =>
                Object.assign({}, window.sessionStorage)
            );
        }
    }

    async getTokens(): Promise<tokenMap> {
        const storage = await this.getWindowStorage();

        const tokenKeys: tokenMap = {
            idTokens: [],
            accessTokens: [],
            refreshTokens: [],
        };
        Object.keys(storage).forEach(async (key) => {
            if (
                key.includes("idtoken")
            ) {
                tokenKeys.idTokens.push(key);
            } else if (
                key.includes("accesstoken")
            ) {
                tokenKeys.accessTokens.push(key);
            } else if (
                key.includes("refreshtoken")
            ) {
                tokenKeys.refreshTokens.push(key);
            }
        });

        return tokenKeys;
    }

    static validateToken(rawTokenVal: string, tokenType: String): boolean {
        const tokenVal = JSON.parse(rawTokenVal);

        if (
            !BrowserCacheUtils.validateStringField(tokenVal.clientId) ||
            !BrowserCacheUtils.validateStringField(tokenVal.credentialType) ||
            !BrowserCacheUtils.validateStringField(tokenVal.environment) ||
            !BrowserCacheUtils.validateStringField(tokenVal.homeAccountId) ||
            !BrowserCacheUtils.validateStringField(tokenVal.secret) ||
            tokenVal.credentialType !== tokenType
        ) {
            return false;
        }

        if (tokenType === "IdToken" && typeof tokenVal.realm !== "string") {
            return false;
        } else if (tokenType === "AccessToken") {
            if (
                !BrowserCacheUtils.validateStringField(tokenVal.cachedAt) ||
                !BrowserCacheUtils.validateStringField(tokenVal.expiresOn) ||
                !BrowserCacheUtils.validateStringField(
                    tokenVal.extendedExpiresOn
                ) ||
                !BrowserCacheUtils.validateStringField(tokenVal.target)
            ) {
                return false;
            }
        } else if (tokenType === "AccessToken_With_AuthScheme") {
            if (
                !BrowserCacheUtils.validateStringField(tokenVal.keyId) ||
                !BrowserCacheUtils.validateStringField(tokenVal.tokenType)
            ) {
                return false;
            }
        }

        return true;
    }

    static validateStringField(field: any): boolean {
        return typeof field === "string" && field.length > 0;
    }

    async accessTokenForScopesExists(
        accessTokenKeys: Array<string>,
        scopes: Array<String>,
        targetTokenMatchesNumber: number = 1
    ): Promise<boolean> {
        const matches = accessTokenKeys
            .filter((key) => {
                // Ignore PoP tokens
                return key.indexOf("accesstoken_with_authscheme") === -1;
            })
            .filter((key) => {
                return scopes.every((scope) => {
                    return key.includes(scope.toLowerCase());
                });
            });

        return matches.length === targetTokenMatchesNumber;
    }

    async popAccessTokenForScopesExists(
        accessTokenKeys: Array<string>,
        scopes: Array<String>
    ): Promise<boolean> {
        return accessTokenKeys
            .filter((key) => key.indexOf("accesstoken_with_authscheme") !== -1)
            .some((key) => {
                return scopes.every((scope) => {
                    return key.includes(scope.toLowerCase());
                });
            });
    }

    async removeTokens(tokens: Array<string>): Promise<void> {
        if (this.storageType === "localStorage") {
            await Promise.all(
                tokens.map(async (tokenKey) => {
                    await this.page.evaluate(
                        (key) => window.localStorage.removeItem(key),
                        tokenKey
                    );
                })
            );
        } else {
            await Promise.all(
                tokens.map(async (tokenKey) => {
                    await this.page.evaluate(
                        (key) => window.sessionStorage.removeItem(key),
                        tokenKey
                    );
                })
            );
        }
    }

    async getAccountFromCache(): Promise<Array<string> | null> {
        const storage = await this.getWindowStorage();
        const accountKeys = storage["msal.account.keys"];

        return JSON.parse(accountKeys);
    }

    async getTelemetryCacheEntry(
        clientId: string
    ): Promise<ServerTelemetryEntity | null> {
        const storage = await this.getWindowStorage();
        const telemetryKey = BrowserCacheUtils.getTelemetryKey(clientId);

        const telemetryVal = storage[telemetryKey];

        return telemetryVal
            ? (JSON.parse(telemetryVal) as ServerTelemetryEntity)
            : null;
    }

    static getTelemetryKey(clientId: string): string {
        return "server-telemetry-" + clientId;
    }

    async verifyTokenStore(options: {
        scopes: string[];
        idTokens?: number;
        accessTokens?: number;
        refreshTokens?: number;
        numberOfTenants?: number;
    }): Promise<void> {
        const tokenStore = await this.getTokens();
        const { scopes, idTokens, accessTokens, refreshTokens } = options;
        const numberOfTenants = options.numberOfTenants || 1;
        const totalIdTokens = (idTokens || 1) * numberOfTenants;
        const totalAccessTokens = (accessTokens || 1) * numberOfTenants;
        const totalRefreshTokens = refreshTokens || 1;
        expect(tokenStore.idTokens).toHaveLength(totalIdTokens);
        expect(tokenStore.accessTokens).toHaveLength(totalAccessTokens);
        expect(tokenStore.refreshTokens).toHaveLength(refreshTokens || 1);

        const accountKeys = await this.getAccountFromCache();
        expect(accountKeys).toHaveLength(1);

        expect(
            await this.accessTokenForScopesExists(
                tokenStore.accessTokens,
                scopes,
                totalAccessTokens
            )
        ).toBeTruthy();
    }
}
