import puppeteer from "puppeteer";

export type tokenMap = {
    idTokens: string[],
    accessTokens: string[],
    refreshTokens: string[]
}

export class BrowserCacheUtils {
    private page: puppeteer.Page;
    private storageType: string;

    constructor(page: puppeteer.Page, storageType: string) {
        this.page = page;
        this.storageType = storageType;
    }

    getWindowStorage(): Promise<Storage> {
        if (this.storageType === "localStorage") {
            return this.page.evaluate(() =>  Object.assign({}, window.localStorage));
        } else {
            return this.page.evaluate(() => Object.assign({}, window.sessionStorage))
        }
    }
    
    async getTokens(): Promise<tokenMap> {
        const storage = await this.getWindowStorage();
        let tokenKeys: tokenMap = {
            idTokens: [],
            accessTokens: [],
            refreshTokens: []
        }
        
        Object.keys(storage).forEach(async key => {
            if (key.includes("idtoken") && BrowserCacheUtils.validateToken(storage[key], "IdToken")) {
                tokenKeys.idTokens.push(key);
            } else if (key.includes("accesstoken") && BrowserCacheUtils.validateToken(storage[key], "AccessToken")) {
                tokenKeys.accessTokens.push(key);
            } else if (key.includes("refreshtoken") && BrowserCacheUtils.validateToken(storage[key], "RefreshToken")) {
                tokenKeys.refreshTokens.push(key)
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
            
            if (tokenType === "IdToken" && !BrowserCacheUtils.validateStringField(tokenVal.realm)) {
                return false;
            } else if (tokenType === "AccessToken") {
                if (
                    !BrowserCacheUtils.validateStringField(tokenVal.cachedAt) ||
                    !BrowserCacheUtils.validateStringField(tokenVal.expiresOn) ||
                    !BrowserCacheUtils.validateStringField(tokenVal.extendedExpiresOn) ||
                    !BrowserCacheUtils.validateStringField(tokenVal.target)
                    ) {
                        return false;
                    }
                }
                
                return true;
            }
            
    static validateStringField(field: any): boolean {
        return typeof(field) === "string" && field.length > 0;
    }
            
    async accessTokenForScopesExists(accessTokenKeys: Array<string>, scopes: Array<String>): Promise<boolean> {
        const storage = await this.getWindowStorage();
        
        return accessTokenKeys.some((key) => {
            const tokenVal = JSON.parse(storage[key]);
            const tokenScopes = tokenVal.target.split(' ');
            
            return scopes.every((scope) => {
                return tokenScopes.includes(scope.toLowerCase());
            });
        });
    }
            
    async removeTokens(tokens: Array<string>) {
        if (this.storageType === "localStorage") {
            tokens.forEach(async (key) => {
                await this.page.evaluate((key) => window.localStorage.removeItem(key))
            });
        } else {
            tokens.forEach(async (key) => {
                await this.page.evaluate((key) => window.sessionStorage.removeItem(key))
            });
        }
    }
            
    async getAccountFromCache(idTokenKey: string): Promise<Object|null> {
        const storage = await this.getWindowStorage();
        const tokenVal = JSON.parse(storage[idTokenKey]);
        const accountKey = tokenVal.homeAccountId + "-" + tokenVal.environment + "-" + tokenVal.realm;
        
        if (Object.keys(storage).includes(accountKey)) {
            return JSON.parse(storage[accountKey]);
        }
        
        return null
    }
}