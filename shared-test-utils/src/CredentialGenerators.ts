import {
    AccountEntity,
    AccountInfo,
    CredentialType,
    IdTokenEntity,
    TenantProfile,
    TokenClaims,
    buildTenantProfile,
} from "@azure/msal-common";

export function buildAccountFromIdTokenClaims(
    idTokenClaims: TokenClaims,
    guestIdTokenClaimsList?: TokenClaims[],
    options?: Partial<AccountInfo>
): AccountEntity {
    const { oid, tid, preferred_username, emails, name } = idTokenClaims;
    const tenantId = tid || "";
    const email = emails ? emails[0] : null;

    const homeAccountId = `${oid}.${tid}`;

    const accountInfo: AccountInfo = {
        homeAccountId: homeAccountId || "",
        username: preferred_username || email || "",
        localAccountId: oid || "",
        tenantId: tenantId,
        environment: "login.windows.net",
        authorityType: "MSSTS",
        name: name,
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
    return AccountEntity.createFromAccountInfo({ ...accountInfo, ...options });
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
        credentialType: CredentialType.ID_TOKEN,
        secret: idTokenSecret,
        clientId: "mock_client_id",
        homeAccountId: homeAccountId,
    };

    return { ...idToken, ...options };
}
