namespace MSAL {
    export class AccessTokenCacheItem {
        key: AccessTokenKey;
        value: AccessTokenValue;
        constructor(key: AccessTokenKey, value: AccessTokenValue) {
            this.key = key;
            this.value = value;
        }
    }
}

