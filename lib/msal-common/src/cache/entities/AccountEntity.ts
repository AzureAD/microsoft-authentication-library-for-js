/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CacheAccountType, Separators } from "../../utils/Constants";
import { Authority } from "../../authority/Authority";
import { ICrypto } from "../../crypto/ICrypto";
import { ClientInfo, buildClientInfo } from "../../account/ClientInfo";
import {
    AccountInfo,
    TenantProfile,
    buildTenantProfileFromIdTokenClaims,
} from "../../account/AccountInfo";
import {
    createClientAuthError,
    ClientAuthErrorCodes,
} from "../../error/ClientAuthError";
import { AuthorityType } from "../../authority/AuthorityType";
import { Logger } from "../../logger/Logger";
import {
    TokenClaims,
    getTenantIdFromIdTokenClaims,
} from "../../account/TokenClaims";
import { ProtocolMode } from "../../authority/ProtocolMode";

/**
 * Type that defines required and optional parameters for an Account field (based on universal cache schema implemented by all MSALs).
 *
 * Key : Value Schema
 *
 * Key: <home_account_id>-<environment>-<realm*>
 *
 * Value Schema:
 * {
 *      homeAccountId: home account identifier for the auth scheme,
 *      environment: entity that issued the token, represented as a full host
 *      realm: Full tenant or organizational identifier that the account belongs to
 *      localAccountId: Original tenant-specific accountID, usually used for legacy cases
 *      username: primary username that represents the user, usually corresponds to preferred_username in the v2 endpt
 *      authorityType: Accounts authority type as a string
 *      name: Full name for the account, including given name and family name,
 *      lastModificationTime: last time this entity was modified in the cache
 *      lastModificationApp:
 *      nativeAccountId: Account identifier on the native device
 *      tenantProfiles: Array of tenant profile objects for each tenant that the account has authenticated with in the browser
 * }
 * @internal
 */
export class AccountEntity {
    homeAccountId: string;
    environment: string;
    realm: string;
    localAccountId: string;
    username: string;
    authorityType: string;
    clientInfo?: string;
    name?: string;
    lastModificationTime?: string;
    lastModificationApp?: string;
    cloudGraphHostName?: string;
    msGraphHost?: string;
    nativeAccountId?: string;
    tenantProfiles?: Array<TenantProfile>;

    /**
     * Generate Account Id key component as per the schema: <home_account_id>-<environment>
     */
    generateAccountId(): string {
        const accountId: Array<string> = [this.homeAccountId, this.environment];
        return accountId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Generate Account Cache Key as per the schema: <home_account_id>-<environment>-<realm*>
     */
    generateAccountKey(): string {
        return AccountEntity.generateAccountCacheKey({
            homeAccountId: this.homeAccountId,
            environment: this.environment,
            tenantId: this.realm,
            username: this.username,
            localAccountId: this.localAccountId,
        });
    }

    /**
     * Returns the AccountInfo interface for this account.
     */
    getAccountInfo(): AccountInfo {
        return {
            homeAccountId: this.homeAccountId,
            environment: this.environment,
            tenantId: this.realm,
            username: this.username,
            localAccountId: this.localAccountId,
            name: this.name,
            nativeAccountId: this.nativeAccountId,
            authorityType: this.authorityType,
            // Deserialize tenant profiles array into a Map
            tenantProfiles: new Map(
                (this.tenantProfiles || []).map((tenantProfile) => {
                    return [tenantProfile.tenantId, tenantProfile];
                })
            ),
        };
    }

    /**
     * Returns true if the account entity is in single tenant format (outdated), false otherwise
     */
    isSingleTenant(): boolean {
        return !this.tenantProfiles;
    }

    /**
     * Generates account key from interface
     * @param accountInterface
     */
    static generateAccountCacheKey(accountInterface: AccountInfo): string {
        const homeTenantId = accountInterface.homeAccountId.split(".")[1];
        const accountKey = [
            accountInterface.homeAccountId,
            accountInterface.environment || "",
            homeTenantId || accountInterface.tenantId || "",
        ];

        return accountKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Build Account cache from IdToken, clientInfo and authority/policy. Associated with AAD.
     * @param accountDetails
     */
    static createAccount(
        accountDetails: {
            homeAccountId: string;
            idTokenClaims?: TokenClaims;
            clientInfo?: string;
            cloudGraphHostName?: string;
            msGraphHost?: string;
            environment?: string;
            nativeAccountId?: string;
            tenantProfiles?: Array<TenantProfile>;
        },
        authority: Authority,
        base64Decode?: (input: string) => string
    ): AccountEntity {
        const account: AccountEntity = new AccountEntity();

        if (authority.authorityType === AuthorityType.Adfs) {
            account.authorityType = CacheAccountType.ADFS_ACCOUNT_TYPE;
        } else if (authority.protocolMode === ProtocolMode.AAD) {
            account.authorityType = CacheAccountType.MSSTS_ACCOUNT_TYPE;
        } else {
            account.authorityType = CacheAccountType.GENERIC_ACCOUNT_TYPE;
        }

        let clientInfo: ClientInfo | undefined;

        if (accountDetails.clientInfo && base64Decode) {
            clientInfo = buildClientInfo(
                accountDetails.clientInfo,
                base64Decode
            );
        }

        account.clientInfo = accountDetails.clientInfo;
        account.homeAccountId = accountDetails.homeAccountId;
        account.nativeAccountId = accountDetails.nativeAccountId;

        const env =
            accountDetails.environment ||
            (authority && authority.getPreferredCache());

        if (!env) {
            throw createClientAuthError(
                ClientAuthErrorCodes.invalidCacheEnvironment
            );
        }

        account.environment = env;
        // non AAD scenarios can have empty realm
        account.realm =
            clientInfo?.utid ||
            getTenantIdFromIdTokenClaims(accountDetails.idTokenClaims) ||
            "";

        // How do you account for MSA CID here?
        account.localAccountId =
            clientInfo?.uid ||
            accountDetails.idTokenClaims?.oid ||
            accountDetails.idTokenClaims?.sub ||
            "";

        /*
         * In B2C scenarios the emails claim is used instead of preferred_username and it is an array.
         * In most cases it will contain a single email. This field should not be relied upon if a custom
         * policy is configured to return more than 1 email.
         */
        const preferredUsername =
            accountDetails.idTokenClaims?.preferred_username ||
            accountDetails.idTokenClaims?.upn;
        const email = accountDetails.idTokenClaims?.emails
            ? accountDetails.idTokenClaims.emails[0]
            : null;

        account.username = preferredUsername || email || "";
        account.name = accountDetails.idTokenClaims?.name || "";

        account.cloudGraphHostName = accountDetails.cloudGraphHostName;
        account.msGraphHost = accountDetails.msGraphHost;

        if (accountDetails.tenantProfiles) {
            account.tenantProfiles = accountDetails.tenantProfiles;
        } else {
            const tenantProfiles = [];
            if (accountDetails.idTokenClaims) {
                const tenantProfile = buildTenantProfileFromIdTokenClaims(
                    accountDetails.homeAccountId,
                    accountDetails.idTokenClaims
                );
                tenantProfiles.push(tenantProfile);
            }
            account.tenantProfiles = tenantProfiles;
        }

        return account;
    }

    /**
     * Creates an AccountEntity object from AccountInfo
     * @param accountInfo
     * @param cloudGraphHostName
     * @param msGraphHost
     * @returns
     */
    static createFromAccountInfo(
        accountInfo: AccountInfo,
        cloudGraphHostName?: string,
        msGraphHost?: string
    ): AccountEntity {
        const account: AccountEntity = new AccountEntity();

        account.authorityType =
            accountInfo.authorityType || CacheAccountType.GENERIC_ACCOUNT_TYPE;
        account.homeAccountId = accountInfo.homeAccountId;
        account.localAccountId = accountInfo.localAccountId;
        account.nativeAccountId = accountInfo.nativeAccountId;

        account.realm = accountInfo.tenantId;
        account.environment = accountInfo.environment;

        account.username = accountInfo.username;
        account.name = accountInfo.name;

        account.cloudGraphHostName = cloudGraphHostName;
        account.msGraphHost = msGraphHost;
        // Serialize tenant profiles map into an array
        account.tenantProfiles = Array.from(
            accountInfo.tenantProfiles?.values() || []
        );

        return account;
    }

    /**
     * Generate HomeAccountId from server response
     * @param serverClientInfo
     * @param authType
     */
    static generateHomeAccountId(
        serverClientInfo: string,
        authType: AuthorityType,
        logger: Logger,
        cryptoObj: ICrypto,
        idTokenClaims?: TokenClaims
    ): string {
        // since ADFS/DSTS do not have tid and does not set client_info
        if (
            !(
                authType === AuthorityType.Adfs ||
                authType === AuthorityType.Dsts
            )
        ) {
            // for cases where there is clientInfo
            if (serverClientInfo) {
                try {
                    const clientInfo = buildClientInfo(
                        serverClientInfo,
                        cryptoObj.base64Decode
                    );
                    if (clientInfo.uid && clientInfo.utid) {
                        return `${clientInfo.uid}.${clientInfo.utid}`;
                    }
                } catch (e) {}
            }
            logger.warning("No client info in response");
        }

        // default to "sub" claim
        return idTokenClaims?.sub || "";
    }

    /**
     * Validates an entity: checks for all expected params
     * @param entity
     */
    static isAccountEntity(entity: object): boolean {
        if (!entity) {
            return false;
        }

        return (
            entity.hasOwnProperty("homeAccountId") &&
            entity.hasOwnProperty("environment") &&
            entity.hasOwnProperty("realm") &&
            entity.hasOwnProperty("localAccountId") &&
            entity.hasOwnProperty("username") &&
            entity.hasOwnProperty("authorityType")
        );
    }

    /**
     * Helper function to determine whether 2 accountInfo objects represent the same account
     * @param accountA
     * @param accountB
     * @param compareClaims - If set to true idTokenClaims will also be compared to determine account equality
     */
    static accountInfoIsEqual(
        accountA: AccountInfo | null,
        accountB: AccountInfo | null,
        compareClaims?: boolean
    ): boolean {
        if (!accountA || !accountB) {
            return false;
        }

        let claimsMatch = true; // default to true so as to not fail comparison below if compareClaims: false
        if (compareClaims) {
            const accountAClaims = (accountA.idTokenClaims ||
                {}) as TokenClaims;
            const accountBClaims = (accountB.idTokenClaims ||
                {}) as TokenClaims;

            // issued at timestamp and nonce are expected to change each time a new id token is acquired
            claimsMatch =
                accountAClaims.iat === accountBClaims.iat &&
                accountAClaims.nonce === accountBClaims.nonce;
        }

        return (
            accountA.homeAccountId === accountB.homeAccountId &&
            accountA.localAccountId === accountB.localAccountId &&
            accountA.username === accountB.username &&
            accountA.tenantId === accountB.tenantId &&
            accountA.environment === accountB.environment &&
            accountA.nativeAccountId === accountB.nativeAccountId &&
            claimsMatch
        );
    }
}
