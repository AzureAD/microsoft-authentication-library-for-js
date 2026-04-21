import {
    AccountEntity,
    AccountInfo,
    Constants,
    IdTokenEntity,
    TenantProfile,
    TokenClaims,
    buildTenantProfile,
    AccountEntityUtils,
} from "@azure/msal-common";

export function buildAccountFromIdTokenClaims(
    idTokenClaims: TokenClaims,
    guestIdTokenClaimsList?: TokenClaims[],
    options?: Partial<AccountInfo>
): AccountEntity {
    const accountInfo = buildAccountInfoFromIdTokenClaims(
        idTokenClaims,
        guestIdTokenClaimsList
    );
    return AccountEntityUtils.createAccountEntityFromAccountInfo({
        ...accountInfo,
        ...options,
    });
}

export function buildAccountInfoFromIdTokenClaims(
    idTokenClaims: TokenClaims,
    guestIdTokenClaimsList?: TokenClaims[]
): AccountInfo {
    const { oid, tid, preferred_username, emails, name, login_hint, upn } =
        idTokenClaims;
    const tenantId = tid || "";
    const email = emails ? emails[0] : null;

    const homeAccountId = `${oid}.${tid}`;

    const accountInfo: AccountInfo = {
        homeAccountId: homeAccountId || "",
        username: preferred_username || upn || email || "",
        localAccountId: oid || "",
        tenantId: tenantId,
        environment: "login.windows.net",
        authorityType: "MSSTS",
        name: name,
        loginHint: login_hint,
        upn: upn,
        tenantProfiles: new Map<string, TenantProfile>([
            [
                tenantId,
                buildTenantProfile(
                    homeAccountId,
                    oid || "",
                    tenantId,
                    idTokenClaims
                ),
            ],
        ]),
    };
    guestIdTokenClaimsList?.forEach((guestIdTokenClaims: TokenClaims) => {
        const guestTenantId = guestIdTokenClaims.tid || "";
        accountInfo.tenantProfiles?.set(
            guestTenantId,
            buildTenantProfile(
                accountInfo.homeAccountId,
                accountInfo.localAccountId,
                guestTenantId,
                guestIdTokenClaims
            )
        );
    });
    return accountInfo;
}

export function buildIdToken(
    idTokenClaims: TokenClaims,
    idTokenSecret: string,
    options?: Partial<IdTokenEntity>
): IdTokenEntity {
    const { oid, tid } = idTokenClaims;
    const homeAccountId = `${oid}.${tid}`;
    const idToken = {
        realm: tid || "",
        environment: "login.microsoftonline.com",
        credentialType: Constants.CredentialType.ID_TOKEN,
        secret: idTokenSecret,
        clientId: "mock_client_id",
        homeAccountId: homeAccountId,
        lastUpdatedAt: Date.now().toString(),
    };

    return { ...idToken, ...options };
}
