import puppeteer from "puppeteer";
import msal from "@azure/msal-node";


// export async function setupCredentials(envName: string, usertype?: string, federationprovider?:string): Promise<[string, string]> {
//     let username = "";
//     let accountPwd = "";
//     const testCreds = new LabClient();
//     const envResponse = await testCreds.getUserVarsByCloudEnvironment(envName, usertype, federationprovider);
//     const testEnv = envResponse[0];
//     if (testEnv.upn) {
//         username = testEnv.upn;
//     }

//     const testPwdSecret = await testCreds.getSecret(testEnv.labName);

//     accountPwd = testPwdSecret.value;

//     return [username, accountPwd];
// }

export type tokenMap = {
    idTokens: string[],
    accessTokens: string[],
    refreshTokens: string[]
}

export async function getTokens(page: puppeteer.Page): Promise<tokenMap> {
    const cacheJson = require("../data/cache.json");
    // const cache = JSON.stringify(cacheJson);
    // const jsonCache: JsonCache = Deserializer.deserializeJSONBlob(cache);
    // inMemoryCache = Deserializer.deserializeAllCache(jsonCache);

    const storage = await page.evaluate(() =>  Object.assign({}, window.sessionStorage));
    let tokenKeys: tokenMap = {
        idTokens: [],
        accessTokens: [],
        refreshTokens: []
    }

    Object.keys(storage).forEach(async key => {
        console.log(key);
        if (key.includes("idtoken") && validateToken(page, storage[key], "IdToken")) {
            tokenKeys.idTokens.push(key);
        } else if (key.includes("accesstoken") && validateToken(page, storage[key], "AccessToken")) {
            tokenKeys.accessTokens.push(key);
        } else if (key.includes("refreshtoken") && validateToken(page, storage[key], "RefreshToken")) {
            tokenKeys.refreshTokens.push(key)
        }
    });

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
