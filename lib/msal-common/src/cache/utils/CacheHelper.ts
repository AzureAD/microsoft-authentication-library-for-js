/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Separators,
    CredentialType,
    EnvironmentAliases,
    Constants,
    APP_META_DATA,
} from "../../utils/Constants";
import { IAccount } from "../../account/IAccount";
import { AccountEntity } from "../entities/AccountEntity";
import { Credential } from "../entities/Credential";
import { ScopeSet } from "../../request/ScopeSet";

export class CacheHelper {
    /**
     * Helper to convert serialized data to object
     * @param obj
     * @param json
     */
    static toObject<T>(obj: T, json: object): T {
        for (const propertyName in json) {
            obj[propertyName] = json[propertyName];
        }
        return obj;
    }

    /**
     * helper function to swap keys and objects
     * @param cacheMap
     */
    static swap(cacheMap: object): object {
        const ret = {};
        for (const key in cacheMap) {
            ret[cacheMap[key]] = key;
        }
        return ret;
    }

    /**
     * helper function to map an obj to a new keyset
     * @param objAT
     * @param keysMap
     */
    static renameKeys(objAT: Object, keysMap: Object): object {
        const keyValues = Object.keys(objAT).map((key) => {
            if (objAT[key]) {
                const newKey = keysMap[key] || key;
                return { [newKey]: objAT[key] };
            }
            return null;
        });
        return Object.assign({}, ...keyValues);
    }

    /**
     *
     * @param value
     * @param homeAccountId
     */
    static matchHomeAccountId(
        entity: AccountEntity | Credential,
        homeAccountId: string
    ): boolean {
        return homeAccountId === entity.homeAccountId;
    }

    /**
     *
     * @param value
     * @param environment
     * // TODO: Add Cloud specific aliases based on current cloud
     */
    static matchEnvironment(
        entity: AccountEntity | Credential,
        environment: string
    ): boolean {
        if (
            EnvironmentAliases.includes(environment) &&
            EnvironmentAliases.includes(entity.environment)
        ) {
            return true;
        }

        return false;
    }

    /**
     *
     * @param entity
     * @param credentialType
     */
    static matchCredentialType(entity: Credential, credentialType: string): boolean {
        return credentialType.toLowerCase() === entity.credentialType.toLowerCase();
    }

    /**
     *
     * @param entity
     * @param clientId
     */
    static matchClientId(entity: Credential, clientId: string): boolean {
        return clientId === entity.clientId;
    }

    /**
     *
     * @param entity
     * @param realm
     */
    static matchRealm(entity: AccountEntity | Credential, realm: string): boolean {
        return realm === entity.realm;
    }

    /**
     * Returns true if the target scopes are a subset of the current entity's scopes, false otherwise.
     * @param entity
     * @param target
     */
    static matchTarget(entity: Credential, target: string, clientId: string): boolean {
        const entityScopeSet: ScopeSet = ScopeSet.fromString(entity.target, clientId);
        const requestTargetScopeSet: ScopeSet = ScopeSet.fromString(target, clientId);
        return entityScopeSet.containsScopeSet(requestTargetScopeSet);
    }

    /**
     * helper function to return `CredentialType`
     * @param key
     */
    static getCredentialType(key: string): string {
        if (key.indexOf(CredentialType.ACCESS_TOKEN) !== -1) {
            return CredentialType.ACCESS_TOKEN;
        } else if (key.indexOf(CredentialType.ID_TOKEN) !== -1) {
            return CredentialType.ID_TOKEN;
        } else if (key.indexOf(CredentialType.REFRESH_TOKEN) !== -1) {
            return CredentialType.REFRESH_TOKEN;
        }

        return Constants.NOT_DEFINED;
    }

    /**
     * returns if a given cache entity is of the type appmetadata
     * @param key
     */
    static isAppMetadata(key: string): boolean {
        return key.indexOf(APP_META_DATA) !== -1;
    }

    /**
     * Generates account key from interface
     * @param accountInterface
     */
    static generateAccountCacheKey(accountInterface: IAccount): string {
        const accountKey = [
            accountInterface.homeAccountId,
            accountInterface.environment || "",
            accountInterface.tenantId || "",
        ];

        return accountKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * generates Account Id for keys
     * @param homeAccountId
     * @param environment
     */
    private static generateAccountIdForCacheKey(
        homeAccountId: string,
        environment: string
    ): string {
        const accountId: Array<string> = [homeAccountId, environment];
        return accountId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * generates credential key
     */
    static generateCredentialCacheKey(
        homeAccountId: string,
        environment: string,
        credentialType: CredentialType,
        clientId: string,
        realm?: string,
        target?: string,
        familyId?: string
    ): string {
        const credentialKey = [
            this.generateAccountIdForCacheKey(homeAccountId, environment),
            this.generateCredentialIdForCacheKey(
                credentialType,
                clientId,
                realm,
                familyId
            ),
            this.generateTargetForCacheKey(target),
        ];

        return credentialKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Generates Credential Id for keys
     * @param credentialType
     * @param realm
     * @param clientId
     * @param familyId
     */
    private static generateCredentialIdForCacheKey(
        credentialType: CredentialType,
        clientId: string,
        realm?: string,
        familyId?: string
    ): string {
        const clientOrFamilyId =
            credentialType === CredentialType.REFRESH_TOKEN
                ? familyId || clientId
                : clientId;
        const credentialId: Array<string> = [
            credentialType,
            clientOrFamilyId,
            realm || "",
        ];

        return credentialId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Generate target key component as per schema: <target>
     */
    private static generateTargetForCacheKey(scopes: string): string {
        return (scopes || "").toLowerCase();
    }

    static toIAccount(accountObj: AccountEntity): IAccount {
        return {
            homeAccountId: accountObj.homeAccountId,
            environment: accountObj.environment,
            tenantId: accountObj.realm,
            username: accountObj.username
        };
    }
}
