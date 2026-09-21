/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { NodeCacheTestUtils } from "e2e-test-utils/node";

describe("NodeCacheTestUtils", () => {
    let cacheDirectory: string;
    let cacheLocation: string;

    beforeEach(async () => {
        cacheDirectory = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), "msal-node-cache-test-")
        );
        cacheLocation = path.join(cacheDirectory, "cache.json");
    });

    afterEach(async () => {
        await fs.promises.rm(cacheDirectory, {
            recursive: true,
            force: true,
        });
    });

    it("normalizes and expires serialized Pascal-case cache entries", async () => {
        await fs.promises.writeFile(
            cacheLocation,
            JSON.stringify({
                Account: {
                    account: {
                        home_account_id: "home",
                        environment: "login.windows.net",
                        realm: "tenant",
                        local_account_id: "local",
                        username: "user@example.com",
                        authority_type: "MSSTS",
                        name: "User",
                        client_info: "client-info",
                        last_modification_time: "100",
                        last_modification_app: "client",
                        tenantProfiles: [
                            JSON.stringify({
                                tenantId: "tenant",
                                localAccountId: "local",
                            }),
                        ],
                    },
                },
                IdToken: {
                    id: {
                        home_account_id: "home",
                        environment: "login.windows.net",
                        credential_type: "IdToken",
                        client_id: "client",
                        secret: "id-secret",
                        realm: "tenant",
                    },
                },
                AccessToken: {
                    access: {
                        home_account_id: "home",
                        environment: "login.windows.net",
                        credential_type: "AccessToken",
                        client_id: "client",
                        secret: "access-secret",
                        realm: "tenant",
                        target: "scope",
                        cached_at: "100",
                        expires_on: "200",
                        extended_expires_on: "300",
                        refresh_on: "150",
                        key_id: "key",
                        token_type: "Bearer",
                        userAssertionHash: "assertion",
                        resource: "resource",
                        additionalCacheKeyComponents: {
                            component: "value",
                        },
                    },
                },
                RefreshToken: {
                    refresh: {
                        home_account_id: "home",
                        environment: "login.windows.net",
                        credential_type: "RefreshToken",
                        client_id: "client",
                        secret: "refresh-secret",
                        family_id: "1",
                        target: "scope",
                        realm: "tenant",
                    },
                },
            })
        );

        const tokens = await NodeCacheTestUtils.getTokens(cacheLocation);
        expect(tokens.accessTokens[0]).toMatchObject({
            homeAccountId: "home",
            environment: "login.windows.net",
            credentialType: "AccessToken",
            clientId: "client",
            secret: "access-secret",
            realm: "tenant",
            target: "scope",
            cachedAt: "100",
            expiresOn: "200",
            extendedExpiresOn: "300",
            refreshOn: "150",
            keyId: "key",
            tokenType: "Bearer",
            userAssertionHash: "assertion",
            resource: "resource",
            additionalCacheKeyComponents: {
                component: "value",
            },
        });
        expect(tokens.idTokens[0]).toMatchObject({
            homeAccountId: "home",
            environment: "login.windows.net",
            credentialType: "IdToken",
            clientId: "client",
            secret: "id-secret",
            realm: "tenant",
        });
        expect(tokens.refreshTokens[0]).toMatchObject({
            homeAccountId: "home",
            environment: "login.windows.net",
            credentialType: "RefreshToken",
            clientId: "client",
            secret: "refresh-secret",
            familyId: "1",
            target: "scope",
            realm: "tenant",
        });
        expect(await NodeCacheTestUtils.getAccounts(cacheLocation)).toEqual({
            account: expect.objectContaining({
                homeAccountId: "home",
                environment: "login.windows.net",
                realm: "tenant",
                localAccountId: "local",
                username: "user@example.com",
                authorityType: "MSSTS",
                name: "User",
                clientInfo: "client-info",
                lastModificationTime: "100",
                lastModificationApp: "client",
                tenantProfiles: [
                    {
                        tenantId: "tenant",
                        localAccountId: "local",
                    },
                ],
            }),
        });

        await NodeCacheTestUtils.expireAccessTokens(cacheLocation);

        const rawCache = JSON.parse(
            await fs.promises.readFile(cacheLocation, "utf-8")
        );
        expect(rawCache.AccessToken.access).toMatchObject({
            expires_on: "0",
            extended_expires_on: "0",
        });
        expect(rawCache.AccessToken.access).not.toHaveProperty("expiresOn");
        expect(rawCache.AccessToken.access).not.toHaveProperty(
            "extendedExpiresOn"
        );
        expect(
            (await NodeCacheTestUtils.getTokens(cacheLocation)).accessTokens[0]
                .expiresOn
        ).toBe("0");
    });

    it("preserves lower-case in-memory cache entries", async () => {
        await fs.promises.writeFile(
            cacheLocation,
            JSON.stringify({
                accounts: {
                    account: {
                        homeAccountId: "home",
                        localAccountId: "local",
                    },
                },
                idTokens: {
                    id: {
                        homeAccountId: "home",
                        credentialType: "IdToken",
                    },
                },
                accessTokens: {
                    access: {
                        homeAccountId: "home",
                        expiresOn: "200",
                        extendedExpiresOn: "300",
                    },
                },
                refreshTokens: {
                    refresh: {
                        homeAccountId: "home",
                        credentialType: "RefreshToken",
                    },
                },
            })
        );

        expect(
            (await NodeCacheTestUtils.getTokens(cacheLocation)).accessTokens[0]
                .expiresOn
        ).toBe("200");
        expect(await NodeCacheTestUtils.getAccounts(cacheLocation)).toEqual({
            account: {
                homeAccountId: "home",
                localAccountId: "local",
            },
        });

        await NodeCacheTestUtils.expireAccessTokens(cacheLocation);

        const rawCache = JSON.parse(
            await fs.promises.readFile(cacheLocation, "utf-8")
        );
        expect(rawCache.accessTokens.access).toMatchObject({
            expiresOn: "0",
            extendedExpiresOn: "0",
        });
        expect(rawCache.accessTokens.access).not.toHaveProperty("expires_on");
        expect(rawCache.accessTokens.access).not.toHaveProperty(
            "extended_expires_on"
        );
    });
});
