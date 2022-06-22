import { AuthorityMetadataEntity, Logger, LogLevel } from "@azure/msal-common";
import { NodeCacheManager } from "../../src/cache/NodeCacheManager";
import { TEST_CONSTANTS, DEFAULT_CRYPTO_IMPLEMENTATION, DEFAULT_OPENID_CONFIG_RESPONSE } from "../utils/TestConstants";
import { version, name } from '../../package.json';

describe("NodeCacheManager", () => {

    let logger: Logger;

    beforeEach(() => {
        const loggerOptions = {
            loggerCallback: () => {
                // allow user to not set a loggerCallback
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        };
        logger = new Logger(loggerOptions!, name, version);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("Constructor tests", () => {
        const storage = new NodeCacheManager(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
        expect(storage).toBeInstanceOf(NodeCacheManager);

        const cache = storage.getCache();
        expect(Object.keys(cache).length).toBe(0);
    });

    it('should remove all keys from the cache when clear() is called', () => {
        const nodeStorage = new NodeCacheManager(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
        const key = "key"

        nodeStorage.setItem(key, "item");

        expect(nodeStorage.getItem(key)).toEqual("item");

        nodeStorage.clear();

        expect(nodeStorage.getItem(key)).toBeUndefined();
    });

    describe("AuthoritMetadata", () => {
        const host = "login.microsoftonline.com";
        const key = `authority-metadata-${TEST_CONSTANTS.CLIENT_ID}-${host}`;
        const testObj: AuthorityMetadataEntity = new AuthorityMetadataEntity();
        testObj.aliases = [host];
        testObj.preferred_cache = host;
        testObj.preferred_network = host;
        testObj.canonical_authority = TEST_CONSTANTS.DEFAULT_AUTHORITY;
        testObj.authorization_endpoint = DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint;
        testObj.token_endpoint = DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint;
        testObj.end_session_endpoint = DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint;
        testObj.issuer = DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer;
        testObj.jwks_uri = DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri;
        testObj.aliasesFromNetwork = false;
        testObj.endpointsFromNetwork = false;

        it("getAuthorityMetadata() returns null if key is not in cache", () => {
            const nodeStorage = new NodeCacheManager(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
            expect(nodeStorage.containsKey(key)).toBe(false);
            expect(nodeStorage.getAuthorityMetadataKeys()).not.toContain(key);
            expect(nodeStorage.getAuthorityMetadata(key)).toBeNull;
        });

        it("getAuthorityMetadata() returns null if isAuthorityMetadataEntity returns false", () => {
            const nodeStorage = new NodeCacheManager(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
            // @ts-ignore
            nodeStorage.setAuthorityMetadata(key, {});

            expect(nodeStorage.getAuthorityMetadata(key)).toBeNull;
            expect(nodeStorage.containsKey(key)).toBe(true);
            expect(nodeStorage.getAuthorityMetadataKeys()).toContain(key);
        });

        it("setAuthorityMetadata() and getAuthorityMetadata() sets and returns AuthorityMetadataEntity in-memory", () => {
            const nodeStorage = new NodeCacheManager(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
            nodeStorage.setAuthorityMetadata(key, testObj);

            expect(nodeStorage.getAuthorityMetadata(key)).toStrictEqual(testObj);
            expect(nodeStorage.containsKey(key)).toBe(true);
            expect(nodeStorage.getAuthorityMetadataKeys()).toContain(key);
        });

    });


});
