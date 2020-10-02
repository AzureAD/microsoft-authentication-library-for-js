import puppeteer from "puppeteer";
import { Deserializer } from "../../lib/msal-node";
import { JsonCache } from '../../lib/msal-node/dist/cache/serializer/SerializerTypes';

export type tokenMap = {
    idTokens: string[],
    accessTokens: string[],
    refreshTokens: string[]
}

export async function getTokens(jsonCache: JsonCache): Promise<tokenMap> {
    const cache = Deserializer.deserializeAllCache(jsonCache);
    console.log(cache);

    let tokenKeys: tokenMap = {
        idTokens: [],
        accessTokens: [],
        refreshTokens: []
    }

    return tokenKeys;
}

export function validateToken(page: puppeteer.Page, rawTokenVal: string, tokenType: String): boolean {
    const tokenVal = JSON.parse(rawTokenVal);
    
    if (
        !validateStringField(tokenVal.clientId) || 
        !validateStringField(tokenVal.credentialType) ||
        !validateStringField(tokenVal.environment) ||
        !validateStringField(tokenVal.homeAccountId) ||
        !validateStringField(tokenVal.secret) ||
        tokenVal.credentialType !== tokenType
    ) {
        return false;
    }

    if (tokenType === "IdToken" && !validateStringField(tokenVal.realm)) {
            return false;
    } else if (tokenType === "AccessToken") {
        if (
            !validateStringField(tokenVal.cachedAt) ||
            !validateStringField(tokenVal.expiresOn) ||
            !validateStringField(tokenVal.extendedExpiresOn) ||
            !validateStringField(tokenVal.target)
        ) {
            return false;
        }
    }

    return true;
}

function validateStringField(field: any): boolean {
    return typeof(field) === "string" && field.length > 0;
}

export async function accessTokenForScopesExists(page: puppeteer.Page, accessTokenKeys: Array<string>, scopes: Array<String>): Promise<boolean> {
    const storage = await page.evaluate(() =>  Object.assign({}, window.sessionStorage));

    return accessTokenKeys.some((key) => {
        const tokenVal = JSON.parse(storage[key]);
        const tokenScopes = tokenVal.target.split(' ');
        
        return scopes.every((scope) => {
            return tokenScopes.includes(scope.toLowerCase());
        });
    });
}

export async function removeTokens(page: puppeteer.Page, tokens: Array<string>) {
    tokens.forEach(async (key) => {
        await page.evaluate((key) => window.localStorage.removeItem(key))
    });
}

export async function getAccountFromCache(page: puppeteer.Page, idTokenKey: string): Promise<Object|null> {
    const storage = await page.evaluate(() =>  Object.assign({}, window.sessionStorage));
    const tokenVal = JSON.parse(storage[idTokenKey]);
    const accountKey = tokenVal.homeAccountId + "-" + tokenVal.environment + "-" + tokenVal.realm;

    if (Object.keys(storage).includes(accountKey)) {
        return JSON.parse(storage[accountKey]);
    }

    return null
}
