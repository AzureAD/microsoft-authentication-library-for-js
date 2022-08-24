import { DistributedCachePlugin } from "../../../src/cache/distributed/DistributedCachePlugin";
import { AccountEntity, ICachePlugin, TokenCacheContext } from "@azure/msal-common";
import { TokenCache } from "../../../src/cache/TokenCache";
import { MockCache, MOCK_CACHE_STRING, MOCK_PARTITION_KEY } from "../cacheConstants";
import { IPartitionManager } from "../../../src/cache/distributed/IPartitionManager";
import { ICacheClient } from "../../../src/cache/distributed/ICacheClient";

describe("Distributed Cache Plugin Tests for msal-node", () => {
    let distributedCachePluginInstance: ICachePlugin;
    const tokenCache = {
        serialize: jest.fn().mockImplementation((): string => MOCK_CACHE_STRING), 
        deserialize: jest.fn(), 
        getKVStore: jest.fn().mockImplementation(() => ({ [MockCache.idTKey]: MockCache.idT, [MockCache.accKey]: MockCache.acc })) 
    } as unknown as TokenCache
    const tokenCacheContext = { cacheHasChanged: true, tokenCache } as unknown as TokenCacheContext
    const partitionManager = {
        getKey: jest.fn().mockImplementation(async (): Promise<string> => MOCK_PARTITION_KEY ),
        extractKey: jest.fn().mockImplementation(async (accountEntity: AccountEntity): Promise<string> => accountEntity.homeAccountId)
    } as IPartitionManager
    const cacheClient = {
        get: jest.fn().mockImplementation(async (_: string): Promise<string> => MOCK_CACHE_STRING),
        set: jest.fn().mockImplementation(async (_: string, __: string): Promise<string> => "OK")
    } as ICacheClient

    beforeEach(() => {
        distributedCachePluginInstance = new DistributedCachePlugin(cacheClient, partitionManager)
    })

    afterEach(() => {
        jest.clearAllMocks()        
    })

    it("properly handles beforeCacheAccess", async () => {
        // Make the action
        await distributedCachePluginInstance.beforeCacheAccess(tokenCacheContext)

        // Confirm the intended effects
        expect(partitionManager.getKey).toHaveBeenCalled()
        expect(cacheClient.get).toHaveBeenCalledWith(MOCK_PARTITION_KEY)
        expect(tokenCache.deserialize).toHaveBeenCalledWith(MOCK_CACHE_STRING)
    })

    it("properly handles afterCacheAccess", async () => {
        // Make the action
        await distributedCachePluginInstance.afterCacheAccess(tokenCacheContext)

        // Confirm the intended effects
        expect(tokenCache.getKVStore).toHaveBeenCalled()
        expect(partitionManager.extractKey).toHaveBeenCalledWith(MockCache.acc)
        expect(tokenCache.serialize).toHaveBeenCalled()
        expect(cacheClient.set).toHaveBeenCalledWith(MockCache.acc.homeAccountId, MOCK_CACHE_STRING)
    })
})