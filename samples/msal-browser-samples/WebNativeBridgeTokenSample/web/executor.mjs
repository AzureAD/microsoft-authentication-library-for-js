function sameAccount(left, right) {
    return !!left && !!right && left.homeAccountId === right.homeAccountId && left.environment === right.environment && left.tenantId === right.tenantId;
}

function scopeKey(scope) {
    const normalized = scope.toLowerCase();
    const graphPrefix = "https://graph.microsoft.com/";
    return normalized.startsWith(graphPrefix) ? normalized.slice(graphPrefix.length) : normalized;
}

export class WebTokenExecutor {
    constructor(pca, { authority, refreshTokenAndNetwork, registrationConfirmed, testSlice }) {
        this.pca = pca;
        this.authority = authority;
        this.refreshTokenAndNetwork = refreshTokenAndNetwork;
        this.registrationConfirmed = registrationConfirmed === true;
        this.testSlice = testSlice;
    }

    async execute({ method, child, tokenParams }, { signal } = {}) {
        if (signal?.aborted) throw new Error("cancelled");
        if (!this.registrationConfirmed) throw new Error("registration_not_confirmed");
        const account = this.pca.getActiveAccount();
        if (!account) throw new Error("account_unavailable");
        const scopes = tokenParams.scope.split(" ").filter(Boolean);
        const request = {
            scopes,
            authority: this.authority,
            embeddedClientId: child.clientId,
            redirectUri: child.redirectUri,
            correlationId: tokenParams.correlationId,
            account,
            storeInCache: { accessToken: false, idToken: false },
            skipBrokerClaims: true,
            ...(this.testSlice ? { extraQueryParameters: { dc: this.testSlice } } : {}),
        };
        let result;
        if (method === "GetTokenPopup") {
            result = await this.pca.acquireTokenPopup(request);
        } else if (method === "GetToken") {
            result = await this.pca.acquireTokenSilent({ ...request, cacheLookupPolicy: this.refreshTokenAndNetwork });
        } else {
            throw new Error("unsupported_method");
        }
        if (signal?.aborted) throw new Error("cancelled");
        if (!sameAccount(account, this.pca.getActiveAccount())) throw new Error("account_changed");
        const expiresIn = Math.floor((result.expiresOn?.getTime() - Date.now()) / 1000);
        const returnedScopes = result.scopes;
        const validScopes = Array.isArray(returnedScopes) && returnedScopes.every(scope => typeof scope === "string" && /^[\x21\x23-\x5B\x5D-\x7E]+$/.test(scope));
        const grantedScopes = new Set(validScopes ? returnedScopes.map(scopeKey) : []);
        const missingScopes = scopes.filter(scope => !grantedScopes.has(scopeKey(scope)));
        if (!result.accessToken || !result.idToken || result.idTokenClaims?.aud !== child.clientId ||
            !sameAccount(account, result.account) || !account.homeAccountId || !account.environment ||
            !Number.isFinite(expiresIn) || expiresIn <= 0 || result.authority?.replace(/\/$/, "") !== this.authority.replace(/\/$/, "") ||
            !validScopes || missingScopes.length > 0) {
            throw new Error("invalid_token_result");
        }
        return {
            token: { access_token: result.accessToken, id_token: result.idToken, expires_in: expiresIn, scope: returnedScopes.join(" "), authority: this.authority, properties: null },
            account: { homeAccountId: account.homeAccountId, environment: account.environment, tenantId: account.tenantId, localAccountId: result.account.localAccountId, username: result.account.username, name: result.account.name, idToken: result.idToken, idTokenClaims: result.idTokenClaims },
        };
    }
}